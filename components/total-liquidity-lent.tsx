"use client";

import { useQuery } from "@tanstack/react-query";
import { getDebitaData } from "@/services/api";

export default function TotalLiquidityLent() {
  const { data, error } = useQuery({
    queryKey: ["debitaData"],
    queryFn: getDebitaData,
  });

  if (error) {
    return null;
  }

  if (data) {
    return (
      <div>
        <h1>Total Liquidity Lent</h1>
        <p>{data.totalLiquidityLent}</p>
      </div>
    );
  }
}
