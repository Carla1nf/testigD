import { processLenderOfferCreated } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import fetchTokenPrices, { extractAddressFromLlamaUuid, makeLlamaUuids } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"

export const useLendingMarket = () => {
  const { data, isSuccess } = useDebitaDataQuery()
  const currentChain = useCurrentChain()

  // no idea why we are showing the borrow data here but this is what lines up with the V1 code, need to check this!
  const dividedOffers = isSuccess ? processLenderOfferCreated(data.borrow) : undefined

  // in V1, they then render each token address in a loop inside the EachToken component, and this then does an `inddividual` defillama fetch call
  // call defi llama but as a CSV List so it's all in one fetch call
  const tokenLlamaUuids = makeLlamaUuids(currentChain.slug, Array.from((dividedOffers?.keys() ?? []) as Address[]))
  const { data: tokenPrices, isSuccess: isFetched } = useQuery({
    queryKey: ["tokenPrices", tokenLlamaUuids],
    queryFn: () => fetchTokenPrices(tokenLlamaUuids),
    // we want to cache this for 5 minutes
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (isFetched) {
      // Now map the token prices into the divided offers
      tokenPrices.forEach((values, llamaId) => {
        const address = extractAddressFromLlamaUuid(llamaId)
        const dividedOffer = dividedOffers?.get(address)
        if (dividedOffer) {
          dividedOffer.price = values.price
        }
      })
    }
  }, [isFetched, dividedOffers, tokenPrices])

  return {
    borrow: data?.borrow, // why the flip here? investigate
    dividedOffers,
  }
}
