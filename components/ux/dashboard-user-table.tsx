"use client"

import { useControlledAddress } from "@/hooks/useControlledAddress"
import { LoanStatus } from "@/hooks/useLoanValues"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import { cn, range } from "@/lib/utils"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { Address } from "wagmi"
import { Button } from "../ui/button"

const DashboardUserTableItem = dynamic(() => import("../../components/ux/dashboard-user-table-item"), { ssr: false })

const DashboardUserTable = () => {
  const [status, setStatus] = useState<LoanStatus>("Borrowed")

  // Leys simulate getting all the data required for Borrowed and see waht comes up
  // there arre a few RPC requetss here afaik
  const { address } = useControlledAddress()

  // This is the number of loans the user has taken (borrowed)
  const { ownershipBalance } = useOwnershipBalance(address)

  // In v1 they convert this to a range array like [0,1,2,3,4,5] for 6 items
  // they then pass this (id) to the <EachData id={a} status={type} /> component and the current ype, i.e. Borrowed or Lent
  const indexes = useMemo(() => {
    return range(ownershipBalance)
  }, [ownershipBalance])

  return (
    <div className="flex flex-col w-full gap-0 my-5">
      <div className="w-full sm:bg-[#262525] border-b border-[#4A2F35] flex flex-row gap-2 ">
        <div className={cn("min-w-[120px]", status === "Borrowed" ? "table-tab-active" : undefined)}>
          <Button variant="table-tab" onClick={() => setStatus("Borrowed")}>
            Borrowed
          </Button>
        </div>
        <div className={cn("min-w-[120px]", status === "Lent" ? "table-tab-active" : undefined)}>
          <Button variant="table-tab" onClick={() => setStatus("Lent")}>
            Lent
          </Button>
        </div>
      </div>
      <div>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white" suppressHydrationWarning>
            {indexes.map((index) => {
              const responsiveClass = index === 0 ? "" : "sm:hidden"
              return (
                <tr
                  className={cn(
                    "flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left",
                    responsiveClass
                  )}
                  key={index}
                  suppressHydrationWarning
                >
                  <th className="p-3 text-left">Collateral</th>
                  <th className="p-3 text-left">Borrowed</th>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Next Payment</th>
                  <th className="p-3 text-left">Installments</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              )
            })}
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {indexes.map((index) => {
              return <DashboardUserTableItem key={index} address={address as Address} index={index} status={status} />
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DashboardUserTable
