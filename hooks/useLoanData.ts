import { OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { fromDecimals } from "@/lib/erc20"
import {
  findInternalTokenByAddress,
  getValuedAmountCollateral,
  getValuedAmountPrinciple,
  getValuedAsset,
  nftInfoLensType,
} from "@/lib/tokens"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import ownershipsAbi from "../abis/ownerships.json"
import loanCreatedAbi from "../abis/v2/createdLoan.json"
import useCurrentChain from "./useCurrentChain"
import veTokenInfoLensAbi from "../abis/v2/veTokenInfoLens.json"
import { VeTokenInfoIncoming } from "./useNftInfo"
import { useState } from "react"
import { ZERO_ADDRESS } from "@/services/constants"

const LoanDataReceivedSchema = z.object({
  IDS: z.array(z.bigint()),
  assetAddresses: z.array(z.string()),
  assetAmounts: z.array(z.bigint()),
  deadline: z.bigint(),
  deadlineNext: z.bigint(),
  executed: z.boolean(),
  isAssetNFT: z.array(z.boolean()),
  nftData: z.array(z.bigint()),
  timelap: z.number(),
  interestAddress_Lending_NFT: z.string(),
  paymentCount: z.number(),
  paymentsPaid: z.number(),
  paymentAmount: z.bigint(),
})

export const useLoanData = (loanAddress: Address) => {
  const [lenderAddress, setLenderAddress] = useState<Address>()
  const [borrowerAddress, setBorrowerAddress] = useState<Address>()

  const currentChain = useCurrentChain()
  const useLoanDataQuery: any = useQuery({
    queryKey: ["loan-data", currentChain.slug, loanAddress],
    refetchInterval: 30000,
    staleTime: 10000,
    queryFn: async () => {
      const loanData = await readContract({
        address: loanAddress,
        abi: loanCreatedAbi,
        functionName: "getLoanData",
        args: [],
      })

      const parsedData = LoanDataReceivedSchema.parse(loanData)
      console.log("borrower")

      const borrowerId = parsedData?.IDS[1] ?? 0
      try {
        const borrower = await readContract({
          address: OWNERSHIP_ADDRESS,
          abi: ownershipsAbi,
          functionName: "ownerOf",
          args: [borrowerId],
        })
        setBorrowerAddress(borrower as Address)
      } catch (e) {}

      const lenderId = parsedData?.IDS[0] ?? 0

      try {
        const lender = await readContract({
          address: OWNERSHIP_ADDRESS,
          abi: ownershipsAbi,
          functionName: "ownerOf",
          args: [lenderId],
        })
        setLenderAddress(lender as Address)
      } catch (e) {}
      // get the amount of debt that the user has already repaid (if any)
      const claimableDebtRaw = (await readContract({
        address: loanAddress,
        abi: loanCreatedAbi,
        functionName: "claimableAmount", // this is a typo in the contract, needs fixing in solidity
        args: [],
      })) as bigint

      // gets the tokens from the loan
      console.log("testing2")

      const collateralToken = findInternalTokenByAddress(currentChain.slug, parsedData.assetAddresses[1])
      const collateral = {
        address: parsedData.assetAddresses[1],
        token: collateralToken,
        amountRaw: parsedData.assetAmounts[1],
        amount: fromDecimals(parsedData.assetAmounts[1], collateralToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }

      const valueAssetCollateral = getValuedAsset(collateralToken, currentChain.slug)
      const _price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, valueAssetCollateral.address as Address))
      collateral.price = _price.price ?? 0
      collateral.valueUsd = collateral.amount * collateral.price
      console.log("testing3")

      const valueFromUnderlying = nftInfoLensType(collateralToken)
        ? ((await readContract({
            address: (collateralToken?.nft?.infoLens ?? "") as Address,
            abi: veTokenInfoLensAbi,
            functionName: "getDataFrom",
            args: [loanAddress],
          })) as VeTokenInfoIncoming[])
        : null

      // lets do the same for the lender token
      const lenderToken = findInternalTokenByAddress(currentChain.slug, parsedData.assetAddresses[0])
      const lending = {
        address: parsedData.assetAddresses[0],
        amountRaw: parsedData.assetAmounts[0], // notice the subtle name shift from API casing to camelCase
        token: lenderToken,
        amount: fromDecimals(parsedData.assetAmounts[0], lenderToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }
      const valueAssetPrinciple = getValuedAsset(lenderToken, currentChain.slug)
      const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, valueAssetPrinciple.address as Address))
      lending.price = price.price ?? 0
      console.log(collateralToken, collateral.amount, valueFromUnderlying)

      const collateralAmount = getValuedAmountCollateral(
        collateralToken,
        false,
        collateral.amount,
        valueFromUnderlying,
        BigInt(0)
      )
      console.log("testing4")

      collateral.valueUsd = collateralAmount * collateral.price

      lending.valueUsd = lending.amount * lending.price

      const ratio = collateral.valueUsd / lending.valueUsd
      const ltv = (1 / ratio) * 100
      const numberOfLoanDays = Number(parsedData.timelap) / 86400
      // const apr = ((Number(parsedData.interest) / Number(numberOfLoanDays)) * 365) / 1000 // percentages are 0.134 for 13.4%

      // Each payment
      const eachPayment = fromDecimals(parsedData.paymentAmount, lenderToken?.decimals ?? 18)
      const paymentDue = parsedData.paymentCount > parsedData.paymentsPaid
      const paymentAmountRaw = parsedData.paymentAmount
      const paymentAmount = fromDecimals(paymentAmountRaw, lenderToken?.decimals ?? 18)

      // Debt left
      const debtLeftRaw = Number(parsedData.paymentAmount) * (parsedData.paymentCount - parsedData.paymentsPaid)
      const debtLeft = fromDecimals(BigInt(debtLeftRaw), lenderToken?.decimals ?? 18)
      console.log("testing5")

      const now = new Date().getTime()
      const daysInSeconds = Number(parsedData?.deadlineNext) * 1000 - now
      const hasDefaulted = daysInSeconds <= 0
      const hasRepaidLoan =
        parsedData.paymentsPaid >= parsedData.paymentCount && !hasDefaulted && Number(debtLeft) === 0
      const claimableDebt = fromDecimals(claimableDebtRaw, lenderToken?.decimals ?? 18)

      return {
        // apr,
        // interest: Number(parsedData.interest) / 1000,
        borrower: borrowerAddress,
        borrowerId,
        collaterals: collateral,
        claimableDebt,
        claimableDebtRaw,
        cooldown: 0,
        debtLeft,
        debtLeftRaw,
        deadline: parsedData.deadline,
        deadlineNext: parsedData.deadlineNext,
        eachPayment,
        hasClaimedCollateral: parsedData.executed,
        hasLoanCompleted: parsedData.executed,
        hasRepaidLoan,
        hasDefaulted,
        loanAddress,
        lenderAddress: lenderAddress,
        lenderId,
        lending,
        ltv,
        numberOfLoanDays,
        paymentAmount,
        paymentAmountRaw,
        paymentCount: parsedData.paymentCount,
        paymentsPaid: parsedData.paymentsPaid,
        paymentDue,
        ratio,
        timelap: parsedData.timelap,
        totalCollateralValue: collateral.valueUsd,
        principleAddressChart: valueAssetPrinciple.address,
        principleAmountChart: lending.amount, // should be principleAmount
        collateralAddressChart: valueAssetCollateral.address,
        collateralAmountChart: collateralAmount,
        IDS: parsedData?.IDS,
      }
    },
  })

  return useLoanDataQuery
}
