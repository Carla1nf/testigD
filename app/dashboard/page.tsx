"use client"

import { ResumeDash } from "@/components/ux/resume-dash"
import { filterByOwner } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import Image from "next/image"
import { useAccount } from "wagmi"

export default function Dashboard() {
  const { data, isSuccess } = useDebitaDataQuery()
  const { address } = useAccount()

  const userOffersLending: any[] = isSuccess ? filterByOwner(data?.lend, address) : []
  const userOffersCollateral: any[] = isSuccess ? filterByOwner(data?.borrow, address) : []

  return (
    <>
      <div className="flex items-center text-2xl font-bold gap-2 mb-8">
        <Image src="/files/tokens/FTM.svg" width={36} height={36} alt="Fantom network" />
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
