"use client"

import DashboardActiveOffers from "@/components/ux/dashboard-active-offers"
import { DashboardResume } from "@/components/ux/dashboard-resume"
import TokenImage from "@/components/ux/token-image"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { filterByOwner } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import dynamic from "next/dynamic"

const DashboardUserTable = dynamic(() => import("../../components/ux/dashboard-user-table"), { ssr: false })

export default function Dashboard() {
  const { data, isSuccess } = useDebitaDataQuery()
  const { address } = useControlledAddress()
  const userOffersLending: any[] = isSuccess ? filterByOwner(data?.lend, address) : []
  const userOffersCollateral: any[] = isSuccess ? filterByOwner(data?.borrow, address) : []
  const currentChain = useCurrentChain()

  return (
    <>
      <div className="flex items-center text-2xl font-bold gap-2 mb-8">
        <TokenImage width={36} height={36} symbol={currentChain.symbol} chainSlug={currentChain.slug} />
        {currentChain.name}
      </div>
      <div className="flex flex-col-2 gap-16 animate-enter-div">
        <div className="w-3/4 flex flex-col gap-8 ">
          <DashboardResume lending={userOffersLending} collateral={userOffersCollateral} />
          <DashboardUserTable />
        </div>
        <div className="w-1/4">
          <DashboardActiveOffers lending={userOffersLending} collateral={userOffersCollateral} />
        </div>
      </div>
    </>
  )
}
