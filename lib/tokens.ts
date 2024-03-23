import { VeTokenInfoIncoming } from "@/hooks/useNftInfo"
import { formatUnits } from "viem"
import { fantom } from "wagmi/chains"
import z from "zod"
import { toDecimals } from "./erc20"

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
      voter: z.string().optional(),
    })
    .optional()
    .refine(
      (data) => {
        // If the nft object is not provided, pass the validation
        if (data === undefined) {
          return true
        }
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
      name: "fSonic",
      symbol: "fSONIC",
      decimals: 18,
      address: "0x05e31a691405d06708A355C029599c12d5da8b28",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/lp-fsonic.svg",
      nft: undefined,
    },

    {
      name: "TOMB+",
      symbol: "TOMB+",
      decimals: 18,
      address: "0xE53aFA646d48E9EF68fCd559F2a598880a3f1370",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/tomb.png",
      nft: undefined,
    },

    {
      name: "MAFIA",
      symbol: "MAFIA",
      decimals: 18,
      address: "0x3Ba4274fC96fBc269ebD7f7806A15ec0890F34Ea",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/mafia.svg",
      nft: undefined,
    },
    {
      name: "CHILL",
      symbol: "CHILL",
      decimals: 18,
      address: "0xe47d957F83F8887063150AaF7187411351643392",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/chill.svg",
      nft: undefined,
    },
    {
      name: "BAY",
      symbol: "BAY",
      decimals: 18,
      address: "0xd361474bB19C8b98870bb67F5759cDF277Dee7F9",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/bay.png",
      nft: undefined,
    },
    {
      name: "sFTMX",
      symbol: "sFTMX",
      decimals: 18,
      address: "0xd7028092c830b5C8FcE061Af2E593413EbbC1fc1",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/sFTMx.svg",
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
        voter: "0xe3d1a117df7dcac2eb0ac8219341bad92f18dac1",
      },
    },
    {
      name: "sGOAT",
      symbol: "sGOAT",
      decimals: 18,
      address: "0x43F9a13675e352154f745d6402E853FECC388aA5",
      chainId: fantom.id,
      isNative: false,
      isLp: false,
      icon: "/files/tokens/fantom/sGoat.png",
      nft: undefined,
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

export const isNft = (token: Token | undefined) => Boolean(token?.nft)
export const nftInfoLens = (token: Token | undefined) => token?.nft?.infoLens
export const nftInfoLensType = (token: Token | undefined) => token?.nft?.infoLensType
export const nftUnderlying = (token: Token | undefined) => token?.nft?.underlying
export const getDepositedToken = (primitive: Token | undefined, collateral: Token | undefined, isLending: boolean) => {
  return isLending ? primitive : collateral
}
export const getValuedAsset = (token: Token | undefined, chainSlug: string) => {
  const valueAsset = (
    nftInfoLensType(token) ? findInternalTokenBySymbol(chainSlug, nftUnderlying(token) ?? "") : tokenUnderlying(token)
  ) as Token
  return valueAsset
}

const tokenUnderlying = (token: Token | undefined) => {
  if (token?.address == "0xd7028092c830b5c8fce061af2e593413ebbc1fc1") {
    return findTokenByAddress("fantom", "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83")
  }
  return token
}
export const nftUnderlyingToken = (token: Token | undefined, chainSlug?: string) => {
  if (!chainSlug) return undefined
  const underlying = nftUnderlying(token)
  if (!underlying) return undefined
  const found = findInternalTokenBySymbol(chainSlug, underlying)
  return found
}

export const getValuedAmountPrinciple = (
  token: Token | undefined,
  isLending: boolean,
  regularAmount: number,
  underlying: VeTokenInfoIncoming[] | null,
  valueOfVeNFT: bigint | null
) => {
  const amount = (
    nftInfoLensType(token)
      ? formatUnits(
          isLending && underlying ? underlying[0]?.amount : valueOfVeNFT ?? toDecimals(0, 18),
          token?.decimals ?? 0
        )
      : regularAmount
  ) as number
  return amount
}

export const getValuedAmountCollateral = (
  token: Token | undefined,
  isLending: boolean,
  regularAmount: number,
  underlying: VeTokenInfoIncoming[] | null,
  valueOfVeNFT: bigint | null
) => {
  const amount = (
    nftInfoLensType(token)
      ? formatUnits(
          !isLending && underlying && underlying?.length > 0
            ? underlying[0]?.amount
            : valueOfVeNFT ?? toDecimals(0, 18),
          token?.decimals ?? 0
        )
      : regularAmount
  ) as number
  return amount
}
