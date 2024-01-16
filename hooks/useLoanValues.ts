import { DEBITA_LOAN_FACTORY_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals, tokenDecimals, tokenName, tokenSymbol } from "@/lib/erc20"
import { Token, findTokenByAddress } from "@/lib/tokens"
import { useQuery } from "@tanstack/react-query"
import pick from "lodash.pick"
import { getAddress } from "viem"
import { Address } from "wagmi"
import { readContract } from "wagmi/actions"
import ownershipsAbi from "../abis/ownerships.json"
import loanCreatedAbi from "../abis/v2/createdLoan.json"
import loanFactoryABI from "../abis/v2/loanFactory.json"

export type TokenValue = Token & {
  amount: number
  value: number
}

type Loan = {
  address: Address
  collateralOwnerId: number
  collaterals: TokenValue
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

export type LoanStatus = "Borrowed" | "Lent"

export const useLoanValues = (address: Address, index: number, status: LoanStatus) => {
  const useLoanValuesQuery = useQuery({
    queryKey: ["read-loan-values", address, status, index],
    queryFn: async () => {
      // todo: Optimisation - we can read previous values here and ONLY get new values that could change, i.e. the loan data? the claimable debt?
      // See https://tanstack.com/query/latest/docs/react/reference/QueryCache

      const ownerNftTokenId = (await readContract({
        address: OWNERSHIP_ADDRESS,
        abi: ownershipsAbi,
        functionName: "tokenOfOwnerByIndex",
        args: [address, index],
      })) as number

      const loanAddress = (await readContract({
        address: DEBITA_LOAN_FACTORY_ADDRESS,
        abi: loanFactoryABI,
        functionName: "NftID_to_LoanAddress",
        args: [ownerNftTokenId ?? ""],
      })) as Address

      const loanId = 0
      const loanData = (await readContract({
        address: loanAddress,
        abi: loanCreatedAbi,
        functionName: "getLoanData",
        args: [],
      })) as any

      // todo: parse the loanData through zod
      const claimableDebt = (await readContract({
        address: loanAddress,
        abi: loanCreatedAbi,
        functionName: "claimableAmount",
        args: [],
      })) as number

      // Process collateral into meaningful knowledge

      let collaterals = undefined

      const safeAddressCollateral = getAddress(loanData?.assetAddresses[1] ?? "")
      const amount_collateral = loanData?.assetAmounts[1]
      const found_collateral = findTokenByAddress("fantom", safeAddressCollateral)
      if (found_collateral) {
        const value = fromDecimals(amount_collateral, found_collateral.decimals)
        collaterals = {
          ...pick(found_collateral, ["name", "symbol", "address", "chainId", "decimals", "icon"]),
          value,
          amount: Number(amount_collateral),
        }
      } else {
        // this is not a known token, lets get the data required from RPC calls (todo: cache this into extenral tokens cache)
        const decimals = await tokenDecimals({ address: safeAddressCollateral })
        const value = fromDecimals(amount_collateral, decimals)
        collaterals = {
          name: await tokenName({ address: loanData?.assetAddresses[0] ?? "" }),
          symbol: await tokenSymbol({ address: safeAddressCollateral }),
          address: safeAddressCollateral,
          chainId: 250, // hard coded fantom
          amount: Number(amount_collateral),
          decimals,
          value,
        }
      }

      console.log(ownerNftTokenId, "NFTIDso")

      // Lets build the loan object as we want to see it
      let loanToken = undefined
      const safeAddress = getAddress(loanData?.assetAddresses[0] ?? "")
      const found = findTokenByAddress("fantom", safeAddress)
      const amount = loanData?.assetAmounts[0]
      if (found) {
        const value = fromDecimals(amount, found.decimals)
        loanToken = {
          ...pick(found, ["name", "address", "symbol", "chainId", "decimals", "icon", "isNative", "isLp"]), // it might not be safe to pass the whole object
          value,
          amount,
        }
      } else {
        const decimals = await tokenDecimals({ address: loanData?.assetAddresses[0] })
        const value = fromDecimals(amount, decimals)
        loanToken = {
          name: await tokenName({ address: loanData?.assetAddresses[0] ?? "" }),
          symbol: await tokenName({ address: loanData?.assetAddresses[0] ?? "" }),
          address: loanData?.assetAddresses[0],
          chainId: 250, // hard coded fantom
          amount: Number(amount),
          decimals,
          value,
          isNative: false,
          isLp: false, // todo: this is not correct, we need to check if the token is an LP token
          icon: "",
        }
      }

      const {
        collateralOwnerID,
        cooldown,
        deadline,
        deadlineNext,
        executed,
        paymentAmount,
        paymentCount,
        paymentsPaid,
        timelap,
      } = loanData

      const loan: Loan = {
        address: loanAddress as Address,
        collateralOwnerId: collateralOwnerID, // watch-out for the name change here in ID!
        collaterals: collaterals as TokenValue,
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
      }

      return result
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30, // every 30 minutes
  })

  return useLoanValuesQuery
}
