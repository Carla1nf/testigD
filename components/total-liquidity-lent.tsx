"use client"

import useTotalLiquiditylent from "@/hooks/useTotalLiquidityLent"

export default function TotalLiquidityLent() {
  const { totalLiquidityLentDisplayValue } = useTotalLiquiditylent()

  return (
    <div className="text-xs md:text-sm flex h-10 gap-2 md:gap-2 items-center justify-center w-[400px]">
      <p className=" text-gray-400">Total liquidity lent on Dēbita:</p>
      <p className="">{totalLiquidityLentDisplayValue}</p>
    </div>
  )
}
