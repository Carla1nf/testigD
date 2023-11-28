"use client";

import { useQuery } from "@tanstack/react-query";
import { getDebitaData } from "@/server/actions";
import { GetDataResponse } from "@/services/api";

export default function TotalLiquidityLent({
  debitaData,
}: {
  debitaData?: GetDataResponse;
}) {
  // console.log("getDebitaData", getDebitaData);

  return null;
  const { data, error } = useQuery({
    queryKey: ["debitaData"],
    queryFn: getDebitaData,
  });

  console.log("data", data);
  console.log("error", error);

  return null;
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
