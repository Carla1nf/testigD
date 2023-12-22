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

      return {
        // apr,
        // interest: Number(parsedData.interest) / 1000,
        borrower,
        borrowerId,
        collaterals,
        cooldown: parsedData.cooldown,
        deadline: parsedData.deadline,
        deadlineNext: parsedData.deadlineNext,
        executed: parsedData.executed,
        id,
        lender,
        lenderId,
        lending,
        ltv,
        numberOfLoanDays,
        paymentAmount: parsedData.paymentAmount,
        paymentCount: parsedData.paymentCount,
        paymentsPaid: parsedData.paymentsPaid,
        ratio,
        timelap: parsedData.timelap,
        totalCollateralValue,
      }
    },
  })

  return useLoanDataQuery
}
