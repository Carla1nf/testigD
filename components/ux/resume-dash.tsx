"use client"

import { DashboardAccessAlarm, DashboardAccountBalance, DashboardEqualizer, DashboardSavings } from "@/components/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { useNextPayment } from "@/context/next-payment-context"
import { OWNERSHIP_ADDRESS } from "@/utils/contracts"
import { toDays, toHours } from "@/utils/display"
import { ReactNode } from "react"
import { useAccount, useContractRead } from "wagmi"
import ownershipsAbi from "../../abis/ownerships.json"
import { GetDataResponse } from "@/services/api"
// import { ChainData, Circle, CirclesContainer, Container, Logo, NumberData } from "./Styles"

export function ResumeDash({
  lending,
  collateral,
}: {
  lending: GetDataResponse["lend"]
  collateral: GetDataResponse["borrow"]
}) {
  const deadline = useNextPayment()
  const { address } = useAccount()

  const { data: dataBalance } = useContractRead({
    address: OWNERSHIP_ADDRESS,
    abi: ownershipsAbi,
    functionName: "balanceOf",
    args: [address ?? ""],
  })

  return (
    <div className="grid grid-cols-2 gap-4 w-3/4">
      <DashboardItem
        value={Number(dataBalance ?? 0)}
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

const DashboardItem = ({ value, title, Icon }: { value: ReactNode; title: string; Icon: ReactNode }) => {
  return (
    <div key={title} className="relative overflow-hidden dashboard-item-gradient p-3 rounded-lg">
      <div className="text-sm font-bold mb-1">{title}</div>
      <div className="text-2xl font-bold text-[#A957A4]">
        {value === undefined ? <Skeleton className="h-4 h-[80px] w-[200px]" /> : value}
        <div style={{ position: "absolute", color: "white", right: "10px", top: "5px", opacity: "1" }}>{Icon}</div>
      </div>
    </div>
  )
}
