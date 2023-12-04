import { processLenderOfferCreated } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import fetchTokenPrices, { extractAddressFromLlamaUuid, makeLlamaUuids } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"

export const useLendingMarketStats = () => {
  // this is known as the `data` variable in the V1 code
  const { data, isSuccess } = useDebitaDataQuery()
  const currentChain = useCurrentChain()
  const [available, setAvailable] = useState(0)
  const [marketSize, setMarketSize] = useState(0)
  const totalLiquidityLent = isSuccess ? data.totalLiquidityLent : 0

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

      // ok, now we have the token prices, lets calculate the available and market size values
      let countAvailable = 0

      dividedOffers?.forEach((values) => {
        // todo: why are we using base 16 math here? shouldnt this be the token decimals?
        countAvailable += (values.amount / 10 ** 16) * values.price
      })
      setAvailable(countAvailable)

      // No idea why but this is how market size is caclukated
      //   ${(data / 100 + available + (data * 1.2) / 100).toFixed(2)}
      const calcMarketSize = totalLiquidityLent + countAvailable + totalLiquidityLent * 1.2
      setMarketSize(calcMarketSize)
    }
  }, [isFetched, dividedOffers, tokenPrices])

  return {
    available,
    marketSize,
    totalLiquidityLent,
  }
}
