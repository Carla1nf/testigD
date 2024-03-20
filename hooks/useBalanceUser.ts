import { fromDecimals } from "@/lib/erc20"
import { findTokenByAddress } from "@/lib/tokens"
import { Address, useContractRead } from "wagmi"
import { erc20ABI } from "wagmi"
import useCurrentChain from "./useCurrentChain"
export const useBalanceUser = ({
  tokenAddress,
  userAddress,
}: {
  tokenAddress: string | undefined
  userAddress: `0x${string}` | undefined
}) => {
  const chain = useCurrentChain()
  const balanceOf = useContractRead({
    address: tokenAddress as Address,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [userAddress as Address],
  })
  if (!balanceOf.data) return 0
  const getToken = findTokenByAddress(chain.slug, tokenAddress as Address)
  const balance = fromDecimals(balanceOf.data as bigint, getToken?.decimals as number)
  return balance.toFixed(2)
}
