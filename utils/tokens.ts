import { ZERO_ADDRESS } from "@/services/constants"
import { Chain, fantom } from "wagmi/chains"

console.log("fantom", fantom)

export type Token = {
  name: string
  symbol: string
  decimals: number
  address: string
  chainId: number
  isNative: boolean
  icon: string
}

type Tokens = Record<string, Token[]>

export const INTERNAL_TOKENS: Tokens = {
  fantom: [
    {
      name: "FTM",
      symbol: "FTM",
      decimals: 0,
      address: ZERO_ADDRESS,
      chainId: fantom.id,
      isNative: true,
      icon: "/files/tokens/fantom/ftm-native.svg",
    },
  ],
}

export const findInternalTokenBySymbol = (chainSlug: string, symbol: string): Token | undefined => {
  return INTERNAL_TOKENS[chainSlug].find((token) => token.symbol === symbol)
}
