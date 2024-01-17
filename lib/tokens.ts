import { ZERO_ADDRESS } from "@/services/constants"
import { fantom } from "wagmi/chains"
import z from "zod"

const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")

export const tokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  address: ethereumAddressSchema,
  chainId: z.number(),
  isNative: z.boolean(),
  isLp: z.boolean(),
  icon: z.string(),
  nft: z
    .object({
      underlying: z.string().optional(),
      infoLens: ethereumAddressSchema.optional(),
      infoLensType: z.enum(["VeToken"]).optional(),
      description: z.string().optional(),
    })
    .optional()
    .refine(
      (data) => {
        // If infoLens has a value, then infoLensType should also have a value (i.e., it's required)
        if (data.infoLens && !data.infoLensType) {
          return false // This indicates the validation has failed
        }
        return true
      },
      {
        message: "infoLensType is required when infoLens is provided",
        path: ["infoLensType"], // This specifies which field the error message is associated with
      }
    ),
})

export type Token = z.infer<typeof tokenSchema>

type Tokens = Record<string, Token[]>

export const INTERNAL_TOKENS: Tokens = {
  fantom: [
    {
      name: "wFTM",
      symbol: "wFTM",
      decimals: 18,
      address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      chainId: fantom.id,
      isNative: true,
      isLp: false,
      icon: "/files/tokens/fantom/ftm-native.svg",
      nft: undefined,
    },
    // {
    //   name: "FTM",
    //   symbol: "FTM",
    //   decimals: 18,
    //   address: ZERO_ADDRESS,
    //   chainId: fantom.id,
    //   isNative: true,
    //   isLp: false,
    //   icon: "/files/tokens/fantom/ftm-native.svg",
    //   nft: undefined,
    // },
    {
      name: "axlUSDC",
      symbol: "axlUSDC",
      decimals: 6,
      address: "0x1B6382DBDEa11d97f24495C9A90b7c88469134a4",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/axlUSDC.svg",
      nft: undefined,
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
      nft: undefined,
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
      nft: undefined,
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
      nft: undefined,
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
      nft: undefined,
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
      nft: undefined,
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
      nft: undefined,
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
      nft: undefined,
    },

    {
      name: "Bassment Rats",
      symbol: "Rat NFT",
      decimals: 0,
      address: "0x1576570D1AcFCd59750419bd02Eb3386B6897407",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/rats.png",
      nft: undefined,
    },
    {
      name: "Vested EQUAL",
      symbol: "veEQUAL",
      decimals: 18,
      address: "0x8313f3551C4D3984FfbaDFb42f780D0c8763Ce94",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/ve-equal.png",
      nft: {
        infoLensType: "VeToken",
        infoLens: "0xa0fD9265FAC42EcdfFF494e3dB6466b207D98C6D",
        underlying: "EQUAL",
        description:
          "veEQUAL represents locked EQUAL tokens and provides holders with weekly real-yield via epoch voting.",
      },
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

export const isNft = (token: Token) => Boolean(token.nft)
export const nftInfoLens = (token: Token) => token?.nft?.infoLens
export const nftInfoLensType = (token: Token) => token?.nft?.infoLensType
