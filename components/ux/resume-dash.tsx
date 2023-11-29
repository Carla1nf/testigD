"use client"

import { DashboardAccessAlarm, DashboardAccountBalance, DashboardEqualizer, DashboardSavings } from "@/components/icons"
import { useNextPayment } from "@/context/next-payment-context"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import { GetDataResponse } from "@/services/api"
import { toDays, toHours } from "@/utils/display"
import dynamic from "next/dynamic"
import { useAccount } from "wagmi"

// import { ChainData, Circle, CirclesContainer, Container, Logo, NumberData } from "./Styles"

const DashboardItem = dynamic(() => import("./dashboard-item"), { ssr: false })

export function ResumeDash({
  lending,
  collateral,
}: {
  lending: GetDataResponse["lend"]
  collateral: GetDataResponse["borrow"]
}) {
  const deadline = useNextPayment()
  const { address } = useAccount()
  const { ownershipBalance } = useOwnershipBalance(address)

  return (
    <div className="grid grid-cols-2 gap-4 w-3/4">
      <DashboardItem
        value={ownershipBalance}
        title={"Historical loans"}
        Icon={<DashboardEqualizer className="w-[120px] h-[120px] mt-[3px] fill-[#A6A766]" />}
      />
      <DashboardItem
        value={collateral && Array.isArray(collateral) ? collateral.length : undefined}
        title={"Lending offers"}
        Icon={<DashboardAccountBalance className="w-[120px] h-[120px] mt-[3px] fill-[#6B66A7]" />}
      />
      <DashboardItem
        value={lending && Array.isArray(lending) ? lending.length : undefined}
        title={"Borrow offers"}
        Icon={<DashboardSavings className="w-[120px] h-[120px] mt-[3px] fill-[#A76666]" />}
      />
      <DashboardItem
        value={
          <div className="mt-1 text-2xl">
            {toDays(Number(deadline))} <span className="text-xs">DAYS</span> {toHours(Number(deadline))}{" "}
            <span className="text-xs">HOURS </span>
          </div>
        }
        title={"Your next payment"}
        Icon={<DashboardAccessAlarm className="w-[120px] h-[120px] mt-[3px] fill-[#66A76C]" />}
      />
    </div>
  )
}
