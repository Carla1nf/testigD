"use client"

import useTotalLiquiditylent from "@/hooks/useTotalLiquidityLent"

export default function TotalLiquidityLent() {
  const { totalLiquidityLentDisplayValue } = useTotalLiquiditylent()

  return (
    <div className="flex flex-col gap-2 md:gap-2 items-center">
      <p className="text-3xl md:text-5xl">{totalLiquidityLentDisplayValue}</p>
      <p className="text-xs md:text-sm">Liquidity lent on Dēbita.</p>
    </div>
  )
}
