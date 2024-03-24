import { range } from "@/lib/utils"
import axios from "axios"
import { Address } from "viem"
import z from "zod"

interface TokenPriceData {
  decimals: number
  symbol: string
  price: number
  timestamp: number
  confidence: number
}

interface TokenPriceCacheEntry {
  data: TokenPriceData
  fetchedAt: number
}

const tokenPriceCache = new Map<string, TokenPriceCacheEntry>()

// Function to fetch the price of a single token
export async function fetchTokenPrice(uuid: string): Promise<TokenPriceData> {
  const currentTime = Date.now()
  const cacheEntry = tokenPriceCache.get(uuid)

  // Use cached data if valid
  if (cacheEntry && currentTime - cacheEntry.fetchedAt < 300000) {
    return cacheEntry.data
  }

  console.log("Fetching token price for", uuid)

  // Fetch from API if not in cache or cache is stale
  try {
    console.log("NO PRICESSS")
    const response = await axios.get(`https://coins.llama.fi/prices/current/${uuid}`)
    const tokenData: TokenPriceData = response.data.coins[uuid]
    tokenPriceCache.set(uuid, { data: tokenData, fetchedAt: currentTime })

    if (!tokenData.price) {
      if (uuid === "fantom:0x43F9a13675e352154f745d6402E853FECC388aA5") {
        console.log("CHECKING PRICE", uuid)

        const response = await axios.get(
          `https://api.dexscreener.com/latest/dex/pairs/fantom/0xacb5b7a37310854a6e74dd9889f6a98da0ef9975`
        )

        const ResponseData = response.data.pair

        const tokenData: TokenPriceData = {
          decimals: 18,
          symbol: "sGOAT",
          price: ResponseData.priceUsd,
          timestamp: 0,
          confidence: 1,
        }
        console.log(response.data.pair, "TOKEN DATA")
        return tokenData
      }
      return {} as TokenPriceData
    }
    return tokenData
  } catch (error) {
    /* ONLY FOR SGOAT, UNTIL DEFILLAMA STARTS PROVIDING THE PRICE
    
    ## QUICK FIX TO LAUNCH QUICK ##
    
    */
    if (uuid === "fantom:0x43F9a13675e352154f745d6402E853FECC388aA5") {
      console.log("CHECKING PRICE", uuid)

      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/pairs/fantom/0xacb5b7a37310854a6e74dd9889f6a98da0ef9975`
      )

      const ResponseData = response.data.pair

      const tokenData: TokenPriceData = {
        decimals: 18,
        symbol: "sGOAT",
        price: ResponseData.priceUsd,
        timestamp: 0,
        confidence: 1,
      }
      console.log(response.data.pair, "TOKEN DATA")
      return tokenData
    }
    console.error(`Failed to fetch token price for ${uuid}:`, error)
    return {} as TokenPriceData
  }
}

// Function to fetch prices for multiple tokens
export async function fetchTokenPrices(uuids: string[]): Promise<Map<string, TokenPriceData>> {
  const freshData = new Map<string, TokenPriceData>()

  // Filter out UUIDs that need to be fetched
  const uuidsToFetch = uuids.filter(
    (uuid) => !tokenPriceCache.get(uuid) || Date.now() - tokenPriceCache.get(uuid)!.fetchedAt >= 300000
  )

  // Fetch fresh data concurrently for remaining UUIDs
  try {
    const fetchPromises = uuidsToFetch.map((uuid) => fetchTokenPrice(uuid).then((data) => freshData.set(uuid, data)))
    await Promise.all(fetchPromises)

    // Add cached data to the result
    uuids.forEach((uuid) => {
      if (!uuidsToFetch.includes(uuid)) {
        freshData.set(uuid, tokenPriceCache.get(uuid)!.data)
      }
    })

    return freshData
  } catch (error) {
    console.error("Failed to fetch token prices:", error)
    throw error
  }
}

// async function fetchTokenPrices(uuids: string[]): Promise<Map<string, TokenPriceData>> {
//   const currentTime = Date.now()
//   const freshData = new Map<string, TokenPriceData>()

//   // Filter out UUIDs that need to be fetched
//   const uuidsToFetch = uuids.filter((uuid) => {
//     const cacheEntry = tokenPriceCache.get(uuid)

//     if (cacheEntry && currentTime - cacheEntry.fetchedAt < 300000) {
//       freshData.set(uuid, cacheEntry.data) // Use cached data if valid
//       return false
//     }
//     return true
//   })

//   // If all data is fresh, return it immediately
//   if (uuidsToFetch.length === 0) {
//     return freshData
//   }

//   try {
//     // Concatenate UUIDs into a comma-separated string
//     const concatenatedUuids = uuidsToFetch.join(",")
//     const response = await axios.get(`https://coins.llama.fi/prices/current/${concatenatedUuids}`)
//     const responseData = response.data.coins

//     uuidsToFetch.forEach((uuid) => {
//       const tokenData: TokenPriceData = responseData[uuid]
//       tokenPriceCache.set(uuid, { data: tokenData, fetchedAt: currentTime })
//       freshData.set(uuid, tokenData)
//     })

//     return freshData
//   } catch (error) {
//     console.error("Failed to fetch token prices:", error)
//     throw error
//   }
// }

const getTimes = (numberOfTimes: number) => {
  const start = Number((Date.now() / 1000).toFixed(0))
  return range(numberOfTimes).map((index: number) => start - index * 1000000)
}

const makeBatchHistoricalUrl = (llamaUuid: string, times: number[]) => {
  const coins = { [llamaUuid]: times }
  const baseUrl = "https://coins.llama.fi/batchHistorical?coins="
  const encodedQuery = encodeURIComponent(JSON.stringify(coins))
  return baseUrl + encodedQuery
}

const DefiLamaHistoricalPriceSchema = z.object({
  coins: z.record(
    z.object({
      symbol: z.string(),
      prices: z.array(
        z.object({
          timestamp: z.number(),
          price: z.number(),
        })
      ),
    })
  ),
})

type DefiLamaHistoricalPrice = z.infer<typeof DefiLamaHistoricalPriceSchema>

export const fetchHistoricPrices = async (llamaUuid: string, numberOfPrices = 5) => {
  const defaultValue = range(numberOfPrices).fill(0, 0)
  const times = getTimes(numberOfPrices)
  const url = makeBatchHistoricalUrl(llamaUuid, times)

  try {
    const response = await fetch(url)
    const data = await response?.json()
    DefiLamaHistoricalPriceSchema.parse(data)

    // Define a transformation function
    const transformData = (data: DefiLamaHistoricalPrice) => {
      const values = Object.values(data.coins)

      if (values.length === 1) {
        const results = values[0].prices
        results.sort((a, b) => a.timestamp - b.timestamp)
        return results
      }

      return defaultValue
    }

    // Apply the transformation to the schema
    const TransformedDefiLamaHistoricalPriceSchema = DefiLamaHistoricalPriceSchema.transform(transformData)

    // Now use the transformed schema to parse and transform data
    const transformedParsedData = TransformedDefiLamaHistoricalPriceSchema.parse(data)

    return transformedParsedData
  } catch (error) {
    console.error("Failed to fetch historical token prices:", error)
    return defaultValue
  }
}

export const extractAddressFromLlamaUuid = (uuid: string) => uuid.split(":")[1]

export const makeLlamaUuid = (chainSlug: string, address: Address) => `${chainSlug}:${address}`

export const makeLlamaUuids = (chainSlug: string, addresses: Address[]) =>
  addresses.map((address) => makeLlamaUuid(chainSlug, address))

export default fetchTokenPrices
