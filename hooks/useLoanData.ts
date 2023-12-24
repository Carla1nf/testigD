import { DEBITA_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
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
import ownershipsAbi from "../abis/ownerships.json"
import useCurrentChain from "./useCurrentChain"

const LoanDataReceivedSchema = z.object({
  LenderAmount: z.bigint(),
  LenderOwnerId: z.number(),
  LenderToken: z.string(),
  collateralAmount: z.array(z.bigint()),
  collateralOwnerID: z.number(),
  collaterals: z.array(z.string()),
  cooldown: z.bigint(),
  deadline: z.bigint(),
  deadlineNext: z.bigint(),
  executed: z.boolean(),
  paymentAmount: z.bigint(),
  paymentCount: z.bigint(),
  paymentsPaid: z.bigint(),
  timelap: z.bigint(),
})

export const useLoanData = (id: number) => {
  const currentChain = useCurrentChain()
  const useLoanDataQuery: any = useQuery({
    queryKey: ["loan-data", currentChain.slug, id],
    refetchInterval: 30000,
    staleTime: 10000,
    queryFn: async () => {
      const loanData = await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getLOANS_DATA",
        args: [id],
      })

      const parsedData = LoanDataReceivedSchema.parse(loanData)

      const borrowerId = parsedData?.collateralOwnerID ?? undefined
      const borrower = await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "ownerOf",
        args: [borrowerId],
      })

      const lenderId = parsedData?.LenderOwnerId ?? undefined
      const lender = await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "ownerOf",
        args: [lenderId],
      })

      // get the amount of debt that the user has already repaid (if any)
      const claimableDebt = await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "claimeableDebt", // this is a typo in the contract, needs fixing in solidity
        args: [id],
      })

      // gets the tokens from the loan

      const collaterals = parsedData.collaterals.map((address, index) => {
        const token = findInternalTokenByAddress(currentChain.slug, address)
        return {
          address,
          token,
          amountRaw: parsedData.collateralAmount[index],
          amount: fromDecimals(parsedData.collateralAmount[index], token?.decimals ?? 18),
          price: 0,
          valueUsd: 0,
        }
      })

      let totalCollateralValue = 0
      for (let i = 0; i < collaterals.length; i++) {
        const collateral = collaterals[i]
        const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, collateral.address as Address))
        collateral.price = price.price ?? 0
        collateral.valueUsd = collateral.amount * collateral.price
        totalCollateralValue += collateral.valueUsd
      }

      // lets do the same for the lender token
      const lenderToken = findInternalTokenByAddress(currentChain.slug, parsedData.LenderToken)
      const lending = {
        address: parsedData.LenderToken,
        amountRaw: parsedData.LenderAmount, // notice the subtle name shift from API casing to camelCase
        token: lenderToken,
        amount: fromDecimals(parsedData.LenderAmount, lenderToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }
      const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, lending.address as Address))
      lending.price = price.price ?? 0
      lending.valueUsd = lending.amount * lending.price

      const ratio = totalCollateralValue / lending.valueUsd
      const ltv = (1 / ratio) * 100
      const numberOfLoanDays = Number(parsedData.timelap) / 86400
      // const apr = ((Number(parsedData.interest) / Number(numberOfLoanDays)) * 365) / 1000 // percentages are 0.134 for 13.4%

      // Each payment
      const eachPayment = fromDecimals(parsedData.paymentAmount, lenderToken?.decimals ?? 18)
      const paymentDue = parsedData.paymentCount > parsedData.paymentsPaid
      const paymentAmountRaw = parsedData.paymentAmount
      const paymentAmount = fromDecimals(paymentAmountRaw, lenderToken?.decimals ?? 18)

      // Debt left
      const debtLeftRaw = parsedData.paymentAmount * (parsedData.paymentCount - parsedData.paymentsPaid)
      const debtLeft = fromDecimals(debtLeftRaw, lenderToken?.decimals ?? 18)

      const now = new Date().getTime()
      const daysInSeconds = Number(parsedData?.deadlineNext) * 1000 - now
      const hasDefaulted = daysInSeconds <= 0

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
        collaterals,
        claimableDebt,
        cooldown: parsedData.cooldown,
        debtLeft,
        debtLeftRaw,
        deadline: parsedData.deadline,
        deadlineNext: parsedData.deadlineNext,
        eachPayment,
        hasClaimedCollateral: parsedData.executed,
        hasLoanCompleted: parsedData.executed,
        hasDefaulted,
        id,
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
        totalCollateralValue,
      }
    },
  })

  return useLoanDataQuery
}
