"use client"

import { ShowWhenTrue } from "@/components/ux/conditionals"
import DashboardActiveOffers from "@/components/ux/dashboard-active-offers"
import { DashboardResume } from "@/components/ux/dashboard-resume"
import TokenImage from "@/components/ux/token-image"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { filterByOwner } from "@/services/api"
import { useDebitaDataQuery } from "@/services/queries"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const DashboardUserTable = dynamic(() => import("../../components/ux/dashboard-user-table"), { ssr: false })

export default function Dashboard() {
  const [selectedData, setSelectedData] = useState("Lend offers")
  const [add, setAdd] = useState("")
  const { data, isSuccess } = useDebitaDataQuery()
  const { address } = useControlledAddress()
  const userOffersLending: any[] = isSuccess ? filterByOwner(data?.lend, address) : []
  const userOffersCollateral: any[] = isSuccess ? filterByOwner(data?.borrow, address) : []
  const currentChain = useCurrentChain()

  useEffect(() => {
    if (address) {
      setAdd(address)
    }
  }, [address])

  return (
    <>
      <div className="flex items-center text-2xl font-bold gap-2 mb-8 -mt-10">
        <div className="flex flex-col gap-2">
          <div className="flex gap-3  text-sm font-medium items-center">
            <div className="h-20 overflow-hidden w-20 items-center flex justify-center rounded-full bg-pink-600/5">
              <img src="files/icon/Grupo.svg" />
            </div>
            <div className="flex gap-2 items-center border border-[#A957A4]/50 px-2 py-1.5 rounded-lg">
              <TokenImage width={20} height={20} symbol={currentChain.symbol} chainSlug={currentChain.slug} />
              {currentChain.name}
            </div>

            <div className="flex gap-2 items-center border border-[#A957A4]/50 px-2 py-1.5 rounded-lg">
              <ShowWhenTrue when={add != ""}>
                <img src="files/icon/Wallet.svg" width={20} />
                {`${add?.substring(0, 4)}...${add?.substring(38)}`}
              </ShowWhenTrue>
            </div>
          </div>
          <DashboardResume lending={userOffersLending} collateral={userOffersCollateral} />
        </div>
      </div>
      <div className="w-full flex flex-col gap-1 ">
        <div className="flex text-sm text-neutral-400 font-bold gap-6 border-b-2 border-neutral-700/90 ">
          {["Lend offers", "Borrow offers", "Lent", "Borrowed"].map((item, index) => {
            return (
              <div
                onClick={() => setSelectedData(item)}
                className={`${
                  selectedData == item ? "border-b-4 border-debitaPink" : "border-b-0"
                } transition-all cursor-pointer hover:text-neutral-200`}
              >
                {" "}
                {item}
              </div>
            )
          })}
        </div>
        <ShowWhenTrue when={selectedData == "Lent" || selectedData == "Borrowed"}>
          <DashboardUserTable currentStatus={selectedData == "Lent" ? "Lent" : "Borrowed"} />
        </ShowWhenTrue>

        <ShowWhenTrue when={selectedData == "Lend offers" || selectedData == "Borrow offers"}>
          <DashboardActiveOffers
            lending={userOffersLending}
            collateral={userOffersCollateral}
            status={selectedData == "Lend offers" ? "Lent" : "Borrowed"}
          />
        </ShowWhenTrue>
      </div>
    </>
  )
}
