import axios from "axios"
import { Address } from "viem"

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

async function fetchTokenPrices(uuids: string[]): Promise<Map<string, TokenPriceData>> {
  const currentTime = Date.now()
  const freshData = new Map<string, TokenPriceData>()

  // Filter out UUIDs that need to be fetched
  const uuidsToFetch = uuids.filter((uuid) => {
    const cacheEntry = tokenPriceCache.get(uuid)

    if (cacheEntry && currentTime - cacheEntry.fetchedAt < 300000) {
      freshData.set(uuid, cacheEntry.data) // Use cached data if valid
      return false
    }
    return true
  })

  // If all data is fresh, return it immediately
  if (uuidsToFetch.length === 0) {
    return freshData
  }

  try {
    // Concatenate UUIDs into a comma-separated string
    const concatenatedUuids = uuidsToFetch.join(",")
    const response = await axios.get(`https://coins.llama.fi/prices/current/${concatenatedUuids}`)
    const responseData = response.data.coins

    uuidsToFetch.forEach((uuid) => {
      const tokenData: TokenPriceData = responseData[uuid]
      tokenPriceCache.set(uuid, { data: tokenData, fetchedAt: currentTime })
      freshData.set(uuid, tokenData)
    })

    return freshData
  } catch (error) {
    console.error("Failed to fetch token prices:", error)
    throw error
  }
}

export const extractAddressFromLlamaUuid = (uuid: string) => uuid.split(":")[1]

export const makeLlamaUuid = (chainSlug: string, address: Address) => `${chainSlug}:${address}`

export const makeLlamaUuids = (chainSlug: string, addresses: Address[]) =>
  addresses.map((address) => makeLlamaUuid(chainSlug, address))

export default fetchTokenPrices
