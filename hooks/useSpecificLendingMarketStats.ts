import { useEffect, useState } from "react"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"
import useTokenPrice from "./useTokenPrice"
import { useLendingMarket } from "./useLendingMarket"
import { findInternalTokenByAddress } from "@/lib/tokens"
import BigNumber from "bignumber.js"

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
        // todo: this is wrong, we shouldnt be using base 16 math here, shouldnt this be the token decimals?
        const waitingToBeLentValue = BigNumber(dividedOffer.amount)
          .div(BigNumber(10).pow(16))
          .times(tokenPricing?.price ?? 0)
          .toNumber()

        setWaitingToBeLent(waitingToBeLentValue)
        setMediumInterest(dividedOffer.averageApr)
      }
    }
  }, [dividedOffers, address, token])

  // waitingToBeLent amount is the total lending amounts for this token * price

  // useEffect(() => {
  //   if (borrow) {
  //     // ok, now we have the token prices, lets calculate the available and marketSize values
  //     let countAvailable = 0
  //     dividedOffers?.forEach((values) => {
  //       // todo: why are we using base 16 math here? shouldnt this be the token decimals?
  //       countAvailable += (values.amount / 10 ** 16) * values.price
  //     })
  //     setAvailable(countAvailable)

  //     // No idea why but this is how market size is calculated
  //     //   ${(data / 100 + available + (data * 1.2) / 100).toFixed(2)}
  //     const calcMarketSize = totalLiquidityLent + countAvailable + totalLiquidityLent * 1.2
  //     setMarketSize(calcMarketSize)
  //   }
  // }, [borrow, dividedOffers])

  return {
    price: tokenPricing?.price ?? 0,
    waitingToBeLent,
    mediumInterest,
  }
}
