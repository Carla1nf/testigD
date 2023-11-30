import { DEBITA_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals, tokenDecimals, tokenName } from "@/lib/erc20"
import { useQuery } from "@tanstack/react-query"
import { readContract } from "wagmi/actions"
import { getAddress } from "viem"
import { Address } from "wagmi"
import debitaAbi from "../abis/debita.json"
import ownershipsAbi from "../abis/ownerships.json"

type Token = {
  name: string
  address?: Address
  amount: number
  decimals: number
  value?: number
}

type Collateral = {
  token: Token
}

type Loan = {
  id: number
  collaterals?: Collateral[]
  cooldown: bigint
  deadline: bigint
  deadlineNext: bigint
  executed: boolean
  lenderOwnerId: number
  paymentAmount: bigint
  paymentCount: bigint
  paymentsPaid: bigint
  timelap: bigint
  token: Token
}

export const useLoanValues = (address: `0x${string}` | undefined, index: number) => {
  const useLoanValuesQuery = useQuery({
    queryKey: ["read-loan-values", address, index],
    queryFn: async () => {
      // todo: Optimisation - we can read previous values here and ONLY get new values that could change, i.e. the loan data? the claimable debt?

      const ownerNftTokenId = await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "tokenOfOwnerByIndex",
        args: [address, index],
      })

      const loanId = await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "loansByNFt",
        args: [ownerNftTokenId ?? ""],
      })

      const loanData = (await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getLOANS_DATA",
        args: [loanId ?? ""],
      })) as any

      // todo: parse the loanData through zod

      const claimableDebt = await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "claimeableDebt",
        args: [loanData?.LenderOwnerId ?? ""],
      })

      // Process collateral into meaningful knowledge
      const collaterals = loanData.collaterals.map(async (collateral: Address, index: number) => {
        const safeAddress = getAddress(collateral)
        const amount = loanData?.collateralAmount[index] ?? 0
        const decimals = await tokenDecimals({ address: safeAddress })
        const value = fromDecimals(amount, decimals)
        return {
          name: await tokenName({ address: safeAddress }),
          address: safeAddress,
          amount,
          decimals,
          value,
        }
      })

      // Lets build the loan object as we want to see it
      const decimals = await tokenDecimals({ address: loanData?.LenderToken })
      const amount = loanData?.LenderAmount
      const value = fromDecimals(amount, decimals)
      const { cooldown, deadline, deadlineNext, executed, paymentAmount, paymentCount, paymentsPaid, timelap } =
        loanData
      const loan: Loan = {
        id: index,
        collaterals,
        cooldown,
        deadline,
        deadlineNext,
        executed,
        lenderOwnerId: loanData?.LenderOwnerId,
        paymentAmount,
        paymentCount,
        paymentsPaid,
        timelap,
        token: {
          name: await tokenName({ address: loanData?.LenderToken ?? "" }),
          address: loanData?.LenderToken,
          amount,
          decimals,
          value,
        },
      }

      const result = {
        claimableDebt,
        ownerNftTokenId,
        loan,
        loanId,
        // loanData,
      }

      return result
    },
    refetchInterval: MILLISECONDS_PER_MINUTE, // every minute
  })

  return useLoanValuesQuery
}
