import { findInternalTokenByAddress } from "@/lib/tokens"
import { LenderOfferTokenData, processLenderOfferCreated } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"

export const useBorrowMarket = () => {
  const { data } = useDebitaDataQuery()
  const currentChain = useCurrentChain()

  console.log("useBorrowMarket->data", data)

  const query: any = useQuery({
    queryKey: ["borrow-market-divided-offers", currentChain.slug, data?.lend?.length],
    queryFn: async () => {
      // todo: why do we reference the lend data in the borrow market?
      const dividedOffers = processLenderOfferCreated(data?.lend ?? [])
      const offers: LenderOfferTokenData[] = Array.from(dividedOffers.values())

      console.log("dividedOffers", dividedOffers)

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]
        const tokenLlamaUuid = makeLlamaUuid(currentChain.slug, offer.tokenAddress as Address)
        const tokenPrice = await fetchTokenPrice(tokenLlamaUuid)
        const token = findInternalTokenByAddress(currentChain.slug, offer.tokenAddress as Address)
        offer.price = tokenPrice?.price ?? 0
        offer.token = token

        /**
         * This is the calc from V1
         * <>${params.amounts * price <= 1 * 10 ** 18 ? " <1.00" : ((params.amounts / 10 ** 18) * price).toFixed(2)}</>
         */
        offer.liquidityOffer = offer.amount * offer.price
      }

      return { dividedOffers, offers }
    },
  })

  return {
    lend: data?.lend, // todo: why the flip here? investigate
    offers: query?.data?.offers ?? undefined,
  }
}
