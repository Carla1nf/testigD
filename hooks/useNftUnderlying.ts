import { Token, isNft, nftUnderlyingToken } from "@/lib/tokens"
import { Address } from "viem"
import useTokenPrice from "./useTokenPrice"

const useNftUnderlying = ({ token, chainSlug }: { token?: Token; chainSlug: string }) => {
  const underlying = isNft(token) ? nftUnderlyingToken(token, chainSlug) : undefined

  const pricing = useTokenPrice(chainSlug, underlying?.address as Address)

  return {
    underlying,
    underlyingPrice: pricing?.price ?? 0,
  }
}

export default useNftUnderlying
