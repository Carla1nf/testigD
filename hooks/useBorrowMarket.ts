import veTokenInfoLensAbi from "@/abis/v2/veTokenInfoLens.json"
import { toDecimals } from "@/lib/erc20"
import {
  findInternalTokenByAddress,
  findTokenByAddress,
  getValuedAmountPrinciple,
  getValuedAsset,
  nftInfoLensType,
} from "@/lib/tokens"
import { LenderOfferTokenData, processLenderOfferCreated } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import useCurrentChain from "./useCurrentChain"
import { VeTokenInfoIncoming } from "./useNftInfo"
export const useBorrowMarket = () => {
  const { data } = useDebitaDataQuery()
  const currentChain = useCurrentChain()

  const query: any = useQuery({
    queryKey: ["borrow-market-divided-offers", currentChain.slug, data?.lend?.length],
    queryFn: async () => {
      // todo: why do we reference the lend data in the borrow market?
      const dividedOffers = processLenderOfferCreated(data?.lend ?? [])
      const offers: LenderOfferTokenData[] = Array.from(dividedOffers.values())

      try {
        for (let i = 0; i < offers.length; i++) {
          const offer = offers[i]
          offer.token = findTokenByAddress(currentChain.slug, offer.tokenAddress)

          const valueFromUnderlying = nftInfoLensType(offer.token)
            ? ((await readContract({
                address: (offer.token?.nft?.infoLens ?? "") as Address,
                abi: veTokenInfoLensAbi,
                functionName: "getDataFrom",
                args: [offer.events[0].address],
              })) as VeTokenInfoIncoming[])
            : null

          const valueAssetPrinciple = getValuedAsset(offer.token, currentChain.slug)
          const principleAmount = getValuedAmountPrinciple(
            offer.token,
            true,
            offer.amount,
            valueFromUnderlying,
            toDecimals(0, 18)
          )

          const tokenLlamaUuid = makeLlamaUuid(currentChain.slug, valueAssetPrinciple.address as Address)
          const tokenPrice = await fetchTokenPrice(tokenLlamaUuid)
          const token = findInternalTokenByAddress(currentChain.slug, offer.tokenAddress as Address)
          offer.price = tokenPrice?.price ?? 0
          offer.token = token
          console.log(token, i)
          console.log(offer.tokenAddress, i)
          /**
           * This is the calc from V1
           * <>${params.amounts * price <= 1 * 10 ** 18 ? " <1.00" : ((params.amounts / 10 ** 18) * price).toFixed(2)}</>
           */

          offer.liquidityOffer = principleAmount * offer.price
        }
      } catch (e) {
        console.error(e)
      }

      return { dividedOffers, offers }
    },
  })

  return {
    lend: data?.lend, // todo: why the flip here? investigate
    offers: query?.data?.offers ?? undefined,
  }
}
