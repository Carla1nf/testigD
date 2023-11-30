import { formatUnits, getAddress } from "viem"
import { useContractRead } from "wagmi"
import erc20Abi from "../abis/erc20.json"
import { findInternalTokenByAddress } from "./tokens"

export const tokenName = ({
  address,
  forceChainLookup = false,
}: {
  address: `0x${string}`
  forceChainLookup?: boolean
}) => {
  if (!address) {
    return ""
  }

  const safeAddress = getAddress(address) // make sure it is checksummed first

  // is this a known token?
  if (forceChainLookup === false) {
    // todo: xchain - we hard code to 'fantom' for now, this will be dynamic in the future
    const found = findInternalTokenByAddress("fantom", safeAddress)
    if (found) {
      return found.name
    }
  }

  // Yes! we read the symbol, not the name for unknown tokens!
  const { data: tokenName } = useContractRead({
    address: safeAddress,
    abi: erc20Abi,
    functionName: "symbol",
  })

  return (tokenName as string) ?? ""
}

export const tokenDecimals = ({
  address,
  forceChainLookup = false,
}: {
  address: `0x${string}`
  forceChainLookup?: boolean
}) => {
  if (!address) {
    return 0
  }

  const safeAddress = getAddress(address) // make sure it is checksummed first

  // is this a known token?
  if (forceChainLookup === false) {
    // todo: xchain - we hard code to 'fantom' for now, this will be dynamic in the future
    const found = findInternalTokenByAddress("fantom", safeAddress)

    if (found) {
      return Number(found.decimals)
    }
  }

  // Yes! we read the symbol, not the name for unknown tokens!
  const { data: tokenDecimals } = useContractRead({
    address: safeAddress,
    abi: erc20Abi,
    functionName: "decimals",
  })

  return Number(tokenDecimals) ?? 0
}

export const fromDecimals = (amount: bigint, decimals: number) => {
  return Number(formatUnits(amount, decimals))
}
