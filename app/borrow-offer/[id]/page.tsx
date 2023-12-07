"use client"

import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import { PriceIcon } from "@/components/icons"
import BackLink from "@/components/ux/back-link"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useOfferCollateralData } from "@/hooks/useOfferCollateralData"
import { dollars, ltv } from "@/lib/display"
import { LucideChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function BorrowOffer({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  console.log("id", id)

  const router = useRouter()
  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: collateralData } = useOfferCollateralData(address, id)

  const lendingToken = collateralData?.lending?.token ?? undefined

  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 lg:mb-16">
        {/* Breadcrumbs idea */}
        <div className="flex gap-1 text-xs items-center mb-4">
          <DisplayNetwork currentChain={currentChain} size={18} />
          {lendingToken ? (
            <>
              <LucideChevronRight className="w-4 h-4 stroke-neutral-500" />
              <Link href={`/lend/`} className="hover:text-white/75">
                Lending Market
              </Link>
              <LucideChevronRight className="w-4 h-4 stroke-neutral-500" />
              <Link href={`/lend/${lendingToken?.address}`}>
                <DisplayToken size={18} token={lendingToken} className="hover:text-white/75" />
              </Link>
            </>
          ) : null}
        </div>

        <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
          <div className="space-y-2 hidden @6xl:flex flex-col justify-center">
            <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">
              Lend ID #{Number(id)}{" "}
              {/* {lendingToken ? (
                <>
                  <LucideChevronRight className="w-4 h-4 stroke-neutral-500" />
                  <DisplayToken size={28} token={lendingToken} className="flex-row-reverse gap-1" />
                </>
              ) : null} */}
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <Stat value={ltv(collateralData?.ltv)} title={"LTV"} Icon={null} />
            <Stat
              value={dollars({ value: collateralData?.lending?.valueUsd })}
              title={"Lending"}
              Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
            />
            <Stat
              value={dollars({ value: collateralData?.totalCollateralValue })}
              title={"Collateral"}
              Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
            />
          </div>
        </div>
      </div>
      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        {/* Chart */}
        <div>
          <ChartWrapper>
            <LoanChart
              loanData={{
                historicalLender: [100.2, 99.15, 100.4, 101.4, 100.3],
                historicalCollateral: [89.97, 109.3, 141.88, 142.44, 148.53],
                lastLender: 100.3,
                lastCollateral: 148.53,
                timestamps: ["22/10/23", "02/11/23", "14/11/23", "25/11/23", "07/12/23"],
              }}
            />
          </ChartWrapper>
        </div>
        {/* Form */}
        <div>Hello there, I am a form.</div>
      </div>
    </>
  )
}
