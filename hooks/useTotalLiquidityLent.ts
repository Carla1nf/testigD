"use client"

import { useDebitaDataQuery } from "@/services/queries"
import { dollars } from "@/lib/display"

export default function useTotalLiquiditylent() {
  const { data, isSuccess } = useDebitaDataQuery()
  const totalLiquidityLent = isSuccess ? data.totalLiquidityLent : 0
  return {
    totalLiquidityLent,
    totalLiquidityLentDisplayValue: dollars({ value: totalLiquidityLent }),
  }
}
