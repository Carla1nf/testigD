"use client"

import { useLoanValues } from "@/hooks/useLoanValues"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import { range } from "@/lib/utils"
import { useAccount } from "wagmi"

export type DashboardUserTableType = "Borrowed" | "Lent"

export function DashboardUserTable() {
  // Leys simulate getting all the data required for Borrowed and see waht comes up
  // there arre a few RPC requetss here afaik
  const { address } = useAccount()

  // This is the number of loans the user has taken (borrowed)
  const { ownershipBalance } = useOwnershipBalance(address)

  // In v1 they convert this to a range array like [0,1,2,3,4,5] for 6 items
  // they then pass this (id) to the <EachData id={a} status={type} /> component and the current ype, i.e. Borrowed or Lent

  // Next we get the token of owner by index

  const indexes = range(ownershipBalance)

  // This will get called per index
  const result = useLoanValues(address, 5)

  return null
}
