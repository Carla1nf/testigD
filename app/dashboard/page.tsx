"use client"

import { ResumeDash } from "@/components/ux/resume-dash"
import TokenImage from "@/components/ux/token-image"
import { filterByOwner } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import { useAccount } from "wagmi"

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
          <ResumeDash lending={userOffersLending} collateral={userOffersCollateral} />
          {/* <UserBox type={"Borrow"} /> */}
        </div>
        <div>Active Offers</div>
      </div>
    </>
  )
}
