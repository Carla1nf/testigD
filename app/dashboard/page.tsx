"use client"

import { DashboardResume } from "@/components/ux/dashboard-resume"
import TokenImage from "@/components/ux/token-image"
import { filterByOwner } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import dynamic from "next/dynamic"
import { useAccount } from "wagmi"

// Import your component with ssr set to false
const DashboardUserTable = dynamic(() => import("../../components/ux/dashboard-user-table"), { ssr: false })

export default function Dashboard() {
  const { data, isSuccess } = useDebitaDataQuery()
  const { address } = useAccount()
  const userOffersLending: any[] = isSuccess ? filterByOwner(data?.lend, address) : []
  const userOffersCollateral: any[] = isSuccess ? filterByOwner(data?.borrow, address) : []

  return (
    <>
      <div className="flex items-center text-2xl font-bold gap-2 mb-8">
        <TokenImage width={36} height={36} symbol={"FTM"} chainSlug={"fantom"} />
        Fantom Network
      </div>
      <div className="flex flex-col-2 gap-8">
        <div className="w-3/4">
          <DashboardResume lending={userOffersLending} collateral={userOffersCollateral} />
          <DashboardUserTable />
        </div>
        <div>Active Offers</div>
      </div>
    </>
  )
}
