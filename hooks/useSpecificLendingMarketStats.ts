import { findInternalTokenByAddress } from "@/lib/tokens"
import BigNumber from "bignumber.js"
import { useEffect, useState } from "react"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"
import { useLendingMarket } from "./useLendingMarket"
import useTokenPrice from "./useTokenPrice"

export const useSpecificLendingMarketStats = (address: string) => {
  const [waitingToBeLent, setWaitingToBeLent] = useState(0)
  const [mediumInterest, setMediumInterest] = useState(0)
  const currentChain = useCurrentChain()
  const tokenPricing = useTokenPrice(currentChain.slug, address as Address)
  const { dividedOffers } = useLendingMarket()
  const token = findInternalTokenByAddress(currentChain.slug, address as Address)

  useEffect(() => {
    if (dividedOffers) {
      const dividedOffer = dividedOffers.get(address)
      if (dividedOffer) {
        // todo: this is wrong, we shouldn't be using base 16 math here, shouldn't this be the token decimals?
        const waitingToBeLentValue = BigNumber(dividedOffer.amount)
          .div(BigNumber(10).pow(16))
          .times(tokenPricing?.price ?? 0)
          .toNumber()

        setWaitingToBeLent(waitingToBeLentValue)
        setMediumInterest(dividedOffer.averageApr)
      }
    }
  }, [dividedOffers, address, token, tokenPricing?.price])

  return {
    price: tokenPricing?.price ?? 0,
    waitingToBeLent,
    mediumInterest,
  }
}
