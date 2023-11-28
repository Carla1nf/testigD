"use client";

import { useDebitaDataQuery } from "@/services/queries";
import { dollars } from "@/utils/display";

export default function TotalLiquidityLent() {
  const { data, isSuccess } = useDebitaDataQuery();

  const totalLiquidityLent = isSuccess ? data.totalLiquidityLent : 0;

  return (
    <div className="flex flex-col gap-2 md:gap-2 items-center">
      <p className="text-3xl md:text-5xl">
        {dollars({ value: totalLiquidityLent })}
      </p>
      <p className="text-xs md:text-sm">Liquidity lent on Dēbita.</p>
    </div>
  );
}
