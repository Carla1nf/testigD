"use client"

import { DashboardAccessAlarm, DashboardAccountBalance, DashboardEqualizer, DashboardSavings } from "@/components/icons"
import { useNextPayment } from "@/context/next-payment-context"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import { GetDataResponse } from "@/services/api"
import dynamic from "next/dynamic"
import DaysHours from "./deadline-datetime"

// import { ChainData, Circle, CirclesContainer, Container, Logo, NumberData } from "./Styles"

const DashboardResumeItem = dynamic(() => import("./dashboard-resume-item"), { ssr: false })

export function DashboardResume({
  lending,
  collateral,
}: {
  lending: GetDataResponse["lend"]
  collateral: GetDataResponse["borrow"]
}) {
  const deadline = useNextPayment()
  const { address } = useControlledAddress()
  const { ownershipBalance } = useOwnershipBalance(address)

  return (
    <div className="flex md:flex-row flex-col w-full gap-6">
      <DashboardResumeItem
        value={ownershipBalance}
        title={"Active loans"}
        Icon={<DashboardEqualizer className="w-[120px] h-[120px] mt-[3px] fill-[#A6A766]" />}
      />
      <DashboardResumeItem
        value={collateral && Array.isArray(lending) ? lending.length : undefined}
        title={"Lending offers"}
        Icon={<DashboardAccountBalance className="w-[120px] h-[120px] mt-[3px] fill-[#6B66A7]" />}
      />
      <DashboardResumeItem
        value={lending && Array.isArray(collateral) ? collateral.length : undefined}
        title={"Borrow offers"}
        Icon={<DashboardSavings className="w-[120px] h-[120px] mt-[3px] fill-[#A76666]" />}
      />
      <DashboardResumeItem
        value={
          <div className="mt-1 text-2xl">
            <DaysHours deadline={Number(deadline)} />
          </div>
        }
        title={"Your next payment"}
        Icon={<DashboardAccessAlarm className="w-[120px] h-[120px] mt-[3px] fill-[#66A76C]" />}
      />
    </div>
  )
}
