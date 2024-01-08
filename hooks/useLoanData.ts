import { DEBITA_ADDRESS, LOAN_CREATED_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals } from "@/lib/erc20"
import { findInternalTokenByAddress } from "@/lib/tokens"
import { ZERO_ADDRESS } from "@/services/constants"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import debitaAbi from "../abis/debita.json"
import loanCreatedAbi from "../abis/v2/createdLoan.json"
import ownershipsAbi from "../abis/ownerships.json"
import useCurrentChain from "./useCurrentChain"

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
  const currentChain = useCurrentChain()
  const useLoanDataQuery: any = useQuery({
    queryKey: ["loan-data", currentChain.slug, loanAddress],
    refetchInterval: 30000,
    staleTime: 10000,
    queryFn: async () => {
      const loanData = await readContract({
        address: LOAN_CREATED_ADDRESS,
        abi: loanCreatedAbi,
        functionName: "getLoanData",
        args: [],
      })

      console.log(loanData)

      const parsedData = LoanDataReceivedSchema.parse(loanData)

      const borrowerId = parsedData?.IDS[1] ?? undefined
      const borrower = await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "ownerOf",
        args: [borrowerId],
      })

      const lenderId = parsedData?.IDS[0] ?? undefined
      const lender = await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "ownerOf",
        args: [lenderId],
      })

      // get the amount of debt that the user has already repaid (if any)
      const claimableDebtRaw = await readContract({
        address: LOAN_CREATED_ADDRESS,
        abi: loanCreatedAbi,
        functionName: "claimableAmount", // this is a typo in the contract, needs fixing in solidity
        args: [],
      })

      // gets the tokens from the loan

      const collateralToken = findInternalTokenByAddress(currentChain.slug, parsedData.assetAddresses[1])
      const collateral = {
        address: parsedData.assetAddresses[1],
        token: collateralToken,
        amountRaw: parsedData.assetAmounts[1],
        amount: fromDecimals(parsedData.assetAmounts[1], collateralToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }

      const priceCollateral = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, collateral.address as Address))
      collateral.price = priceCollateral.price ?? 0
      collateral.valueUsd = collateral.amount * collateral.price

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
      const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, lending.address as Address))
      lending.price = price.price ?? 0
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

      const now = new Date().getTime()
      const daysInSeconds = Number(parsedData?.deadlineNext) * 1000 - now
      const hasDefaulted = daysInSeconds <= 0
      const hasRepaidLoan =
        parsedData.paymentsPaid >= parsedData.paymentCount && !hasDefaulted && Number(debtLeft) === 0
      const claimableDebt = fromDecimals(claimableDebtRaw, lenderToken?.decimals ?? 18)

      // <SingleExtra type={"Large"}>
      //   <div style={{ marginLeft: "10px" }}>Debt Left</div>
      //   <Datas data={"Time"}>
      //     {(
      //       (Number(params.data.paymentAmount._hex) *
      //         (Number(params.data.paymentCount._hex) - Number(params.data.paymentsPaid._hex))) /
      //       10 ** 18
      //     ).toFixed(2)}
      //     <div style={{ opacity: "0.6" }}>{nameLending}</div>
      //   </Datas>
      // </SingleExtra>

      return {
        // apr,
        // interest: Number(parsedData.interest) / 1000,
        borrower,
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
        lender,
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
      }
    },
  })

  return useLoanDataQuery
}
