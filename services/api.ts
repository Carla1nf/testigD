import { Token } from "@/lib/tokens"
import axios from "axios"
import z from "zod"

const GetDataElementSchema = z.tuple([z.string(), z.number(), z.number(), z.string(), z.string()])
const GetDataNestedArraySchema = z.array(GetDataElementSchema)
const GetDataSchema = z.tuple([GetDataNestedArraySchema, GetDataNestedArraySchema, z.number(), z.any(), z.any()])

/**
 * event LenderOfferCreated(
 *   uint256 indexed id,
 *   address indexed _owner,
 *   address lendingToken,
 *   uint apr,
 *   uint lendingAmount
 * );
 */
const LenderOfferCreatedSchema = z.object({
  address: z.string(),
  owner: z.string(),
  lendingToken: z.string(),
  apr: z.number(),
  lendingAmount: z.number(),
})

export type LenderOfferCreated = z.infer<typeof LenderOfferCreatedSchema>

export interface LenderOfferTokenData {
  tokenAddress: string
  averageInterestRate: number
  amount: number
  amountRaw: number
  events: LenderOfferCreated[]
  liquidityOffer: number
  price: number
  token?: Token
}

export const processLenderOfferCreated = (data: LenderOfferCreated[]): Map<string, LenderOfferTokenData> => {
  const tokensMap = new Map<string, LenderOfferTokenData & { totalApr: number }>()

  data.forEach((event) => {
    const tokenAddress = event.lendingToken

    // Check if the token data already exists in the map
    if (tokensMap.has(tokenAddress)) {
      const tokenData = tokensMap.get(tokenAddress)!
      tokenData.events.push(event)
      tokenData.totalApr += event.apr
      tokenData.amount += event.lendingAmount
      tokenData.amountRaw += event.lendingAmount * 10 ** 16
    } else {
      tokensMap.set(tokenAddress, {
        tokenAddress: tokenAddress,
        totalApr: event.apr,
        averageInterestRate: 0,
        amount: event.lendingAmount,
        amountRaw: event.lendingAmount * 10 ** 16,
        events: [event],
        price: 0,
        token: undefined,
        liquidityOffer: 0,
      })
    }
  })

  // ok now that we have collected all events, lets loop again and calculate the actual average apr
  const finalMap = new Map<string, Omit<LenderOfferTokenData, "totalApr">>()

  tokensMap.forEach((tokenData, tokenAddress) => {
    finalMap.set(tokenAddress, {
      tokenAddress: tokenData.tokenAddress,
      averageInterestRate: tokenData.totalApr / tokenData.events.length,
      amount: tokenData.amount,
      amountRaw: tokenData.amountRaw,
      events: tokenData.events,
      price: tokenData.price,
      token: tokenData.token,
      liquidityOffer: tokenData.liquidityOffer,
    })
  })

  return finalMap
}

/**
 * event CollateralOfferCreated(
 *   uint256 indexed id,
 *   address indexed _owner,
 *   address lendingToken,
 *   uint apr,
 *   uint lendingAmount
 * );
 */
const CollateralOfferCreatedSchema = z.object({
  address: z.string(),
  owner: z.string(),
  lendingToken: z.string(),
  apr: z.number(),
  lendingAmount: z.number(),
})

type GetData = z.infer<typeof GetDataSchema>
type GetDataNestedArray = z.infer<typeof GetDataNestedArraySchema>

export type OfferType = "Lend" | "Borrow"

const GetDataResponse = z.object({
  lend: z.array(LenderOfferCreatedSchema),
  borrow: z.array(CollateralOfferCreatedSchema),
  totalLiquidityLent: z.number(),
  pointsPerAddress: z.array(z.array(z.string(), z.number())),
  pointsPerToken: z.array(z.array(z.string(), z.number())),
})

export type GetDataResponse = z.infer<typeof GetDataResponse>

/**
 * Other Events:
 * ============
 * event LenderOfferDeleted(uint256 indexed id, address indexed _owner);
 * event LoanAccepted(uint256 newId, address indexed lendingToken, address[] indexed collateralTokens);
 */
const getData = async () => {
  try {
    // V1 API
    // [collaterals, lending, totalLiquidityLent]
    // const response = await axios.get("https://v4wfbcl0v9.execute-api.us-east-1.amazonaws.com/Deploy/getData")

    // V2 API
    // [collaterals, lending, totalLiquidityLent]
    // todo: move URL into a config file in prep for x-chain app
    const response = await axios.get("https://rbn3bwlfb1.execute-api.us-east-1.amazonaws.com/getData")

    // Important, once parsed we MUST only reference the parsed version (sanitized and confirmed to be correct)
    const parsedResponse = GetDataSchema.parse(response.data)

    return parsedResponse
  } catch (error) {
    console.error("Api→getData", error)
    return {
      lend: [],
      borrow: [],
      totalLiquidityLent: 0,
    }
  }
}

export const getDebitaData = async () => {
  const data = (await getData()) as GetData
  const debitaData = transformGetDataResponse(data)
  return debitaData
}

const transformGetDataResponse = (response: GetData): GetDataResponse => {
  return {
    lend: response[1].map((event) => {
      // console.log("transformGetDataResponse->lend->event", event)
      return LenderOfferCreatedSchema.parse({
        address: event[0],
        owner: event[3],
        lendingToken: event[4],
        apr: event[2] / 1000, // better to use 0-1 range for representing percentages, 0% = 0, 100% = 1, 1% = 0.01, 24.57% = 0.2457
        lendingAmount: event[1] / 100, // we use decimals to represent the amount, so we need to divide by 100 to get the actual amount
      })
    }),
    borrow: response[0].map((event) => {
      return CollateralOfferCreatedSchema.parse({
        address: event[0],
        owner: event[3],
        lendingToken: event[4],
        apr: event[2] / 1000, // better to use 0-1 range for representing percentages, 0% = 0, 100% = 1, 1% = 0.01, 24.57% = 0.2457
        lendingAmount: event[1] / 100, // we use decimals to represent the amount, so we need to divide by 100 to get the actual amount
      })
    }),
    totalLiquidityLent: response[2] / 100,
    pointsPerAddress: response[3],
    pointsPerToken: response[4],
  }
}

export const filterByOwner = (
  items: GetDataResponse["lend"] | GetDataResponse["borrow"],
  owner: `0x${string}` | undefined
) => {
  if (!owner) {
    return []
  }
  return items.filter((item) => item.owner === owner)
}

export type ProcessGetDataNestedArrayResult = {
  tokenAddresses: string[]
  tokenEvents: GetDataNestedArray[]
  sumOfAPR: number[]
  sumOfAmounts: number[]
}

/**
 * @deprecated uses old format, we will update the UI to use the new object format
 * and be more expressive using filters
 */
function getUserEventOffers(eventos: GetDataNestedArray, userAddress: string) {
  return eventos ? eventos.filter((evento) => evento[3] === userAddress) : []
}
