import { DEBITA_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals, tokenDecimals, tokenName, tokenSymbol } from "@/lib/erc20"
import { useQuery } from "@tanstack/react-query"
import { getAddress } from "viem"
import { Address } from "wagmi"
import { readContract } from "wagmi/actions"
import debitaAbi from "../abis/debita.json"
import ownershipsAbi from "../abis/ownerships.json"
import { Token, findTokenByAddress } from "@/lib/tokens"
import pick from "lodash.pick"

export type TokenValue = Token & {
  amount: number
  value: number
}

type Loan = {
  id: number
  collaterals?: TokenValue[]
  cooldown: bigint
  deadline: bigint
  deadlineNext: bigint
  executed: boolean
  lenderOwnerId: number
  paymentAmount: bigint
  paymentCount: bigint
  paymentsPaid: bigint
  timelap: bigint
  token: TokenValue
}

export const useLoanValues = (address: `0x${string}` | undefined, index: number) => {
  const useLoanValuesQuery = useQuery({
    queryKey: ["read-loan-values", address, index],
    queryFn: async () => {
      // todo: Optimisation - we can read previous values here and ONLY get new values that could change, i.e. the loan data? the claimable debt?
      // See https://tanstack.com/query/latest/docs/react/reference/QueryCache

      const ownerNftTokenId = (await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "tokenOfOwnerByIndex",
        args: [address, index],
      })) as number

      const loanId = (await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "loansByNFt",
        args: [ownerNftTokenId ?? ""],
      })) as number

      const loanData = (await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getLOANS_DATA",
        args: [loanId ?? ""],
      })) as any

      // todo: parse the loanData through zod

      const claimableDebt = (await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "claimeableDebt",
        args: [loanData?.LenderOwnerId ?? ""],
      })) as number

      // Process collateral into meaningful knowledge
      const collaterals = await Promise.all(
        loanData.collaterals.map(async (collateral: Address, index: number) => {
          const safeAddress = getAddress(collateral)
          const amount = loanData?.collateralAmount[index] ?? 0
          const found = findTokenByAddress("fantom", safeAddress)
          if (found) {
            const value = fromDecimals(amount, found.decimals)
            return {
              ...pick(found, ["name", "symbol", "address", "chainId", "decimals", "icon"]),
              value,
            }
          }

          // this is not a known token, lets get the data required from RPC calls (todo: cache this into extenral tokens cache)
          const decimals = await tokenDecimals({ address: safeAddress })
          const value = fromDecimals(amount, decimals)
          return {
            name: await tokenName({ address: safeAddress }),
            symbol: await tokenSymbol({ address: safeAddress }),
            address: safeAddress,
            chainId: 250, // hard coded fantom
            amount,
            decimals,
            value,
          }
        })
      )

      // Lets build the loan object as we want to see it
      let loanToken = undefined
      const safeAddress = getAddress(loanData?.LenderToken ?? "")
      const found = findTokenByAddress("fantom", safeAddress)
      const amount = loanData?.LenderAmount
      if (found) {
        const value = fromDecimals(amount, found.decimals)
        loanToken = {
          ...pick(found, ["name", "address", "symbol", "chainId", "decimals", "icon", "isNative", "isLp"]), // it might not be safe to pass the whole object
          value,
          amount,
        }
      } else {
        const decimals = await tokenDecimals({ address: loanData?.LenderToken })
        const value = fromDecimals(amount, decimals)
        loanToken = {
          name: await tokenName({ address: loanData?.LenderToken ?? "" }),
          symbol: await tokenName({ address: loanData?.LenderToken ?? "" }),
          address: loanData?.LenderToken,
          chainId: 250, // hard coded fantom
          amount: Number(amount),
          decimals,
          value,
          isNative: false,
          isLp: false, // todo: this is not correct, we need to check if the token is an LP token
          icon: "",
        }
      }

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
        token: loanToken,
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
    refetchInterval: MILLISECONDS_PER_MINUTE * 30, // every 30 minutes
  })

  return useLoanValuesQuery
}
