"use client"

import { getDebitaData } from "@/services/api"
import { useQuery } from "@tanstack/react-query"

/**
 * This is a cached function that can be called from any component that needs access to the main data
 * it will refresh the data every minute
 * @returns
 */
export const useDebitaDataQuery = () => {
  return useQuery({
    queryKey: ["debitaData"],
    queryFn: getDebitaData,
    refetchInterval: 60 * 1000,
  })
}
