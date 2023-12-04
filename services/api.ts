import z from "zod"
import axios from "axios"

const GetDataElementSchema = z.tuple([z.number(), z.number(), z.number(), z.string(), z.string()])
const GetDataNestedArraySchema = z.array(GetDataElementSchema)
const GetDataSchema = z.tuple([GetDataNestedArraySchema, GetDataNestedArraySchema, z.number()])

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
  id: z.number(),
  owner: z.string(),
  lendingToken: z.string(),
  apr: z.number(),
  lendingAmount: z.number(),
})

export type LenderOfferCreated = z.infer<typeof LenderOfferCreatedSchema>

interface LenderOfferTokenData {
  tokenAddress: string
  apr: number
  amount: number
  events: LenderOfferCreated[]
  price: number
}

export const processLenderOfferCreated = (data: LenderOfferCreated[]): Map<string, LenderOfferTokenData> => {
  const tokensMap = new Map<string, LenderOfferTokenData>()

  data.forEach((event) => {
    const tokenAddress = event.lendingToken

    // Check if the token data already exists in the map
    if (tokensMap.has(tokenAddress)) {
      const tokenData = tokensMap.get(tokenAddress)!
      tokenData.events.push(event)
      tokenData.apr += event.apr
      tokenData.amount += event.lendingAmount * 10 ** 16
    } else {
      // Create a new entry for the token
      tokensMap.set(tokenAddress, {
        tokenAddress: tokenAddress,
        apr: event.apr,
        amount: event.lendingAmount * 10 ** 16,
        events: [event],
        price: 0,
      })
    }
  })

  return tokensMap
}

// export const processLenderOfferCreatedArray = (data: LenderOfferCreated[]) => {
//   return data.reduce(
//     (
//       acc: {
//         tokenAddresses: string[]
//         tokenEvents: LenderOfferCreated[][]
//         aprs: number[]
//         amounts: number[]
//       },
//       event: LenderOfferCreated
//     ) => {
//       const tokenAddress = event.lendingToken
//       const index = acc.tokenAddresses.indexOf(tokenAddress)

//       if (index === -1) {
//         acc.tokenAddresses.push(tokenAddress)
//         acc.tokenEvents.push([event])
//         acc.aprs.push(event.apr)
//         acc.amounts.push(event.lendingAmount * 10 ** 16)
//       } else {
//         acc.tokenEvents[index].push(event)
//         acc.aprs[index] += event.apr
//         acc.amounts[index] += event.lendingAmount * 10 ** 16
//       }

//       return acc
//     },
//     { tokenAddresses: [], tokenEvents: [], aprs: [], amounts: [] }
//   )
// }

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
  id: z.number(),
  owner: z.string(),
  lendingToken: z.string(),
  apr: z.number(),
  lendingAmount: z.number(),
})

type GetData = z.infer<typeof GetDataSchema>
type GetDataElement = z.infer<typeof GetDataElementSchema>
type GetDataNestedArray = z.infer<typeof GetDataNestedArraySchema>

export type OfferType = "Lend" | "Borrow"

const GetDataResponse = z.object({
  lend: z.array(LenderOfferCreatedSchema),
  borrow: z.array(CollateralOfferCreatedSchema),
  totalLiquidityLent: z.number(),
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
    // todo: move URL into a config file in prep for xchain app
    // [collaterals, lending, totalLiquidityLent]
    const response = await axios.get("https://v4wfbcl0v9.execute-api.us-east-1.amazonaws.com/Deploy/getData")
    const parsedResponse = GetDataSchema.parse(response.data)
    // Important, once parsed we MUST only reference the parsed version (sanitized and confirmed to be correct)

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
  // [collaterals, lending, totalLiquidityLent] = GetData
  return {
    lend: response[1].map((event) => {
      return LenderOfferCreatedSchema.parse({
        id: event[0],
        owner: event[3],
        lendingToken: event[4],
        apr: event[2] / 1000, // better to use 0-1 range for representing percentages, 0% = 0, 100% = 1, 1% = 0.01, 24.57% = 0.2457
        lendingAmount: event[1] / 100, // we use decimals to represent the amount, so we need to divide by 100 to get the actual amount
      })
    }),
    borrow: response[0].map((event) => {
      return CollateralOfferCreatedSchema.parse({
        id: event[0],
        owner: event[3],
        lendingToken: event[4],
        apr: event[2] / 1000, // better to use 0-1 range for representing percentages, 0% = 0, 100% = 1, 1% = 0.01, 24.57% = 0.2457
        lendingAmount: event[1] / 100, // we use decimals to represent the amount, so we need to divide by 100 to get the actual amount
      })
    }),
    totalLiquidityLent: response[2] / 100,
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
export const processGetDataNestedArray = (data: GetDataNestedArray): ProcessGetDataNestedArrayResult => {
  return data.reduce(
    (
      acc: {
        tokenAddresses: string[]
        tokenEvents: GetDataNestedArray[]
        sumOfAPR: number[]
        sumOfAmounts: number[]
      },
      event: GetDataElement
    ) => {
      const tokenAddress = event[4]
      const index = acc.tokenAddresses.indexOf(tokenAddress)

      if (index === -1) {
        acc.tokenAddresses.push(tokenAddress)
        acc.tokenEvents.push([event])
        acc.sumOfAPR.push(event[2])
        acc.sumOfAmounts.push(event[1] * 10 ** 16)
      } else {
        acc.tokenEvents[index].push(event)
        acc.sumOfAPR[index] += event[2]
        acc.sumOfAmounts[index] += event[1] * 10 ** 16
      }

      return acc
    },
    { tokenAddresses: [], tokenEvents: [], sumOfAPR: [], sumOfAmounts: [] }
  )
}

/**
 * @deprecated uses old format, we will update the UI to use the new object format
 * and be more expressive using filters
 */
function getUserEventOffers(eventos: GetDataNestedArray, userAddress: string) {
  return eventos ? eventos.filter((evento) => evento[3] === userAddress) : []
}
