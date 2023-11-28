"use client";

import { useDebitaDataQuery } from "@/services/queries";
import { dollars } from "@/utils/display";

export default function TotalLiquidityLent() {
  const { data, isSuccess } = useDebitaDataQuery();

  const totalLiquidityLent = isSuccess ? data.totalLiquidityLent : 0;

  return (
    <div className="flex flex-col gap-4 items-center">
      <p className="text-6xl">{dollars({ value: totalLiquidityLent })}</p>
      <p className="text-sm">of Liquidity lent on Dēbita ecosystem.</p>
    </div>
  );
}
