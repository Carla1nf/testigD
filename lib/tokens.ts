import { ZERO_ADDRESS } from "@/services/constants"
import { fantom } from "wagmi/chains"
import z from "zod"

export const tokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  address: z.string(),
  chainId: z.number(),
  isNative: z.boolean(),
  isLp: z.boolean(),
  icon: z.string(),
})

export type Token = z.infer<typeof tokenSchema>

type Tokens = Record<string, Token[]>

export const INTERNAL_TOKENS: Tokens = {
  fantom: [
    {
      name: "FTM",
      symbol: "FTM",
      decimals: 18,
      address: ZERO_ADDRESS,
      chainId: fantom.id,
      isNative: true,
      isLp: false,
      icon: "/files/tokens/fantom/ftm-native.svg",
    },
    {
      name: "axlUSDC",
      symbol: "axlUSDC",
      decimals: 6,
      address: "0x1B6382DBDEa11d97f24495C9A90b7c88469134a4",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/axlUSDC.svg",
    },
    {
      name: "EQUAL",
      symbol: "EQUAL",
      decimals: 18,
      address: "0x3Fd3A0c85B70754eFc07aC9Ac0cbBDCe664865A6",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/equal.svg",
    },
    {
      name: "BEETS",
      symbol: "BEETS",
      decimals: 18,
      address: "0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/beets.svg",
    },
    {
      name: "BOO",
      symbol: "BOO",
      decimals: 18,
      address: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/boo.svg",
    },
    {
      name: "MUMMY",
      symbol: "MMY",
      decimals: 18,
      address: "0x01e77288b38b416F972428d562454fb329350bAc",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/mmy.svg",
    },
    {
      name: "WIGO",
      symbol: "WIGO",
      decimals: 18,
      address: "0xE992bEAb6659BFF447893641A378FbbF031C5bD6",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/wigo.svg",
    },
    {
      name: "STG",
      symbol: "STG",
      decimals: 18,
      address: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/stg.svg",
    },
    {
      name: "fSonic LP",
      symbol: "fSONIC/WFTM",
      decimals: 18,
      address: "0x767520fA98e1E24b3326fD42B24c9DCFCe8BcE14",
      chainId: fantom.id,
      isNative: false,
      isLp: true,
      icon: "/files/tokens/fantom/lp-fsonic.svg",
    },
  ],
}

export const findInternalTokenBySymbol = (chainSlug: string, symbol: string): Token | undefined => {
  return INTERNAL_TOKENS[chainSlug].find((token) => token.symbol === symbol)
}

export const findInternalTokenByAddress = (chainSlug: string, address: string): Token | undefined => {
  return INTERNAL_TOKENS[chainSlug].find((token) => token.address === address)
}

export const findTokenByAddress = (chainSlug: string, address: string): Token | undefined => {
  const found = findInternalTokenByAddress(chainSlug, address)
  if (found) return found

  // todo, this will also search the external user defined tokens in the future

  return undefined
}

export const getAllTokens = (chainSlug: string) => {
  const tokens = [...INTERNAL_TOKENS[chainSlug]]

  return tokens
}
