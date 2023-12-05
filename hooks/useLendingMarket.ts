import { LenderOfferTokenData, processLenderOfferCreated } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import fetchTokenPrices, { extractAddressFromLlamaUuid, makeLlamaUuids } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"

export const useLendingMarket = () => {
  const { data, isSuccess } = useDebitaDataQuery()
  const currentChain = useCurrentChain()
  const [dividedOffers, setDividedOffers] = useState<Map<string, LenderOfferTokenData>>()

  useEffect(() => {
    if (isSuccess) {
      setDividedOffers(processLenderOfferCreated(data.borrow))
    }
  }, [isSuccess, data])

  // in V1, they then render each token address in a loop inside the EachToken component, and this then does an `inddividual` defillama fetch call
  // call defi llama but as a CSV List so it's all in one fetch call
  const tokenLlamaUuids = makeLlamaUuids(currentChain.slug, Array.from((dividedOffers?.keys() ?? []) as Address[]))
  const { data: tokenPricesResult, isSuccess: isTokenPriceFetchSuccess } = useQuery({
    queryKey: ["token-prices", tokenLlamaUuids],
    queryFn: () => fetchTokenPrices(tokenLlamaUuids),
    // we want to cache this for 5 minutes
    staleTime: 5 * 60 * 1000,
  })

  // Inject prices when received
  useEffect(() => {
    if (isTokenPriceFetchSuccess) {
      const newDividedOffers = new Map(dividedOffers)
      tokenPricesResult.forEach((values, llamaId) => {
        const address = extractAddressFromLlamaUuid(llamaId)
        const dividedOffer = newDividedOffers.get(address)
        if (dividedOffer) {
          dividedOffer.price = values.price
        }
      })

      setDividedOffers(newDividedOffers)
    }
  }, [isTokenPriceFetchSuccess, tokenPricesResult])

  return {
    borrow: data?.borrow, // why the flip here? investigate
    dividedOffers,
  }
}
