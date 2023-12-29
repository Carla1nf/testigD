import { useEffect, useState } from "react"
import { useBorrowMarket } from "./useBorrowMarket"
import useTotalLiquidityLent from "./useTotalLiquidityLent"

export const useBorrowingMarketStats = () => {
  const [available, setAvailable] = useState(0)
  const [marketSize, setMarketSize] = useState(0)
  const { offers, lend } = useBorrowMarket()
  const { totalLiquidityLent } = useTotalLiquidityLent()

  useEffect(() => {
    if (lend) {
      // ok, now we have the token prices, lets calculate the available and marketSize values
      const count = offers?.reduce((acc: number, offer: any) => acc + offer.amount * offer.price, 0)

      // No idea why but this is how market size is calculated
      //   ${(data / 100 + available + (data * 1.2) / 100).toFixed(2)}
      const calcMarketSize = totalLiquidityLent + count + totalLiquidityLent * 1.2
      setAvailable(Number.isNaN(count) ? 0 : count)
      setMarketSize(Number.isNaN(calcMarketSize) ? 0 : calcMarketSize)
    }
  }, [lend, offers, totalLiquidityLent])

  return {
    available,
    marketSize,
    totalLiquidityLent,
  }
}
