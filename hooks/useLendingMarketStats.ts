import { useEffect, useState } from "react"
import { useLendingMarket } from "./useLendingMarket"
import useTotalLiquiditylent from "./useTotalLiquidityLent"

export const useLendingMarketStats = () => {
  const [available, setAvailable] = useState(0)
  const [marketSize, setMarketSize] = useState(0)
  const { dividedOffers, borrow } = useLendingMarket()
  const { totalLiquidityLent } = useTotalLiquiditylent()

  useEffect(() => {
    if (borrow) {
      // ok, now we have the token prices, lets calculate the available and marketSize values
      let countAvailable = 0
      dividedOffers?.forEach((values) => {
        // todo: why are we using base 16 math here? shouldnt this be the token decimals?
        countAvailable += (values.amount / 10 ** 16) * values.price
      })
      setAvailable(countAvailable)

      // No idea why but this is how market size is calculated
      //   ${(data / 100 + available + (data * 1.2) / 100).toFixed(2)}
      const calcMarketSize = totalLiquidityLent + countAvailable + totalLiquidityLent * 1.2
      setMarketSize(calcMarketSize)
    }
  }, [borrow, dividedOffers])

  return {
    available,
    marketSize,
    totalLiquidityLent,
  }
}
