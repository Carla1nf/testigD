import { formatUnits, getAddress } from "viem"

import erc20Abi from "../abis/erc20.json"
import { findInternalTokenByAddress } from "./tokens"
import { readContract } from "wagmi/actions"

/**
 * We read the symbol as name
 * @param param0
 * @returns
 */
export const tokenName = async ({ address }: { address: `0x${string}` }) => tokenSymbol({ address })

// we already read the symbol as the name
export const tokenSymbol = async ({ address }: { address: `0x${string}` }) => {
  if (!address) {
    return ""
  }
  const safeAddress = getAddress(address)

  // todo: xchain - we hard code to 'fantom' for now, this will be dynamic in the future
  const found = findInternalTokenByAddress("fantom", safeAddress)
  if (found) {
    return found.name
  }

  const symbol = await readContract({
    address: safeAddress,
    abi: erc20Abi,
    functionName: "symbol",
  })

  return (symbol as string) ?? ""
}

export const tokenDecimals = async ({ address }: { address: `0x${string}` }) => {
  if (!address) {
    return 0
  }
  const safeAddress = getAddress(address) // make sure it is checksummed first
  // todo: xchain - we hard code to 'fantom' for now, this will be dynamic in the future
  const found = findInternalTokenByAddress("fantom", safeAddress)
  if (found) {
    return Number(found.decimals)
  }

  const tokenDecimals = readContract({
    address: safeAddress,
    abi: erc20Abi,
    functionName: "decimals",
  })

  return Number(tokenDecimals) ?? 0
}

export const fromDecimals = (amount: bigint, decimals: number) => {
  return Number(formatUnits(amount, decimals))
}
