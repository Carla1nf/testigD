import { useEffect, useState } from "react"
import { useLendingMarket } from "./useLendingMarket"
import useTotalLiquidityLent from "./useTotalLiquidityLent"

export const useLendingMarketStats = () => {
  const [available, setAvailable] = useState(0)
  const [marketSize, setMarketSize] = useState(0)
  const { offers, borrow } = useLendingMarket()
  const { totalLiquidityLent } = useTotalLiquidityLent()

  useEffect(() => {
    if (borrow) {
      // ok, now we have the token prices, lets calculate the available and marketSize values
      const count = offers?.reduce((acc: number, offer: any) => acc + offer.amount * offer.price, 0)

      // No idea why but this is how market size is calculated
      //   ${(data / 100 + available + (data * 1.2) / 100).toFixed(2)}
      const calcMarketSize = totalLiquidityLent + count + totalLiquidityLent * 1.2
      setAvailable(count)
      setMarketSize(calcMarketSize)
    }
  }, [borrow, offers, totalLiquidityLent])

  return {
    available,
    marketSize,
    totalLiquidityLent,
  }
}
