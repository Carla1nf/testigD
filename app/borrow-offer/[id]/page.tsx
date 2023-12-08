"use client"

import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import { PersonIcon, PriceIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import { useOfferCollateralData } from "@/hooks/useOfferCollateralData"
import { dollars, ltv, percent, shortAddress, thresholdLow } from "@/lib/display"
import { fixedDecimals } from "@/lib/utils"
import { fetchHistoricPrices, makeLlamaUuid } from "@/services/token-prices"
import dayjs from "dayjs"
import Link from "next/link"
import pluralize from "pluralize"
import { useMemo } from "react"

const getPoints = async (currentChain: any, collateralData: any) => {
  console.log("collateralData", collateralData)
  console.log("currentChain", currentChain)

  // get the historicalLender values
  const llamaUuid = makeLlamaUuid(currentChain?.defiLlamaSlug, collateralData?.lending?.token?.address ?? undefined)
  const prices = await fetchHistoricPrices(llamaUuid)
}

const calcPriceHistory = (prices: any, lendingAmount: number) => {
  if (Array.isArray(prices)) {
    return prices.map((item: any) => fixedDecimals(item.price * lendingAmount))
  }
  return []
}

const calcCollateralsPriceHistory = (prices0: any, amount0: number, prices1: any, amount1: number) => {
  const calcs: any[] = []
  if (Array.isArray(prices0) && prices0.length > 0) {
    calcs.push(prices0.map((item: any) => fixedDecimals(item.price * amount0)))
  }
  if (Array.isArray(prices1) && prices1.length > 0) {
    calcs.push(prices1.map((item: any) => fixedDecimals(item.price * amount1)))
  }

  if (calcs.length > 0) {
    // merge the arrays to account for multiple collaterals
    const merged = calcs[0].map((item: any, index: number) => {
      if (calcs[1] && calcs[1][index]) {
        return item + calcs[1][index]
      }
      return item
    })

    return merged
  }

  return []
}

export default function BorrowOffer({ params }: { params: { id: string } }) {
  const id = Number(params.id)

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: collateralData } = useOfferCollateralData(address, id)

  const lending = collateralData?.lending
  const collateral0 = collateralData?.collaterals[0]
  const collateral1 = collateralData?.collaterals[1]

  const lendingToken = lending ? lending?.token : undefined
  const collateral0Token = collateral0 ? collateral0?.token : undefined
  const collateral1Token = collateral1 ? collateral0?.token : undefined

  const lendingPrices = useHistoricalTokenPrices(currentChain.slug, lendingToken?.address)
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, collateral0Token?.address)
  const collateral1Prices = useHistoricalTokenPrices(currentChain.slug, collateral1Token?.address)

  const timestamps = lendingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  // lets build the real loan data
  const loanData = {
    // historicalLender: [100.2, 99.15, 100.4, 101.4, 100.3],
    historicalLender: calcPriceHistory(lendingPrices, collateralData?.lending?.amount ?? 0),
    // historicalCollateral: [89.97, 109.3, 141.88, 142.44, 148.53],
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      collateralData?.collaterals[0]?.amount ?? 0,
      collateral1Prices,
      collateralData?.collaterals[1]?.amount ?? 0
    ),
    lastLender: 100.3,
    lastCollateral: 148.53,
    timestamps,
  }

  const breadcrumbs = useMemo(() => {
    const result = [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
    if (lendingToken) {
      result.push(
        <Link href={`/lend/`} className="hover:text-white/75" key="lending-market">
          Lending Market
        </Link>
      )
      result.push(
        <Link href={`/lend/${lendingToken?.address}`} key="token">
          <DisplayToken size={18} token={lendingToken} className="hover:text-white/75" />
        </Link>
      )
      return result
    }
    return []
  }, [currentChain, lendingToken])

  // console.log("collateralData", collateralData)

  const totalLoan = Number(collateralData?.lending?.amount ?? 0)
  const totalInterestOnLoan = Number(collateralData?.interest ?? 0) * Number(lending?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(collateralData?.paymentCount ?? 1)

  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 lg:mb-16">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
            <div className="space-y-2 hidden @6xl:flex flex-col justify-center">
              <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">
                Lend ID #{Number(id)}
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
          <div>
            <ChartWrapper>
              <LoanChart loanData={loanData} />
            </ChartWrapper>
          </div>
        </div>
        {/* Form */}
        <div className="space-y-8 max-w-xl w-full">
          <div className="grid grid-cols-2 justify-between gap-8">
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              <PersonIcon className="w-6 h-6" />
              {shortAddress(collateralData?.owner)}
            </div>
            <div>
              {/* Cancel offer */}
              <Button variant="muted" disabled={address === collateralData?.owner} className="h-full w-full">
                Cancel Offer
              </Button>
            </div>
          </div>
          <div className="bg-[#32282D] border border-[#743A49] p-8 rounded-md">
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-2">
                &nbsp;Collateral
                {collateral0 && collateral0Token ? (
                  <DisplayToken size={32} token={collateral0Token} amount={collateral0.amount} className="text-xl" />
                ) : null}
                {collateral1 && collateral1Token ? (
                  <DisplayToken size={32} token={collateral1Token} amount={collateral1.amount} className="text-xl" />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                &nbsp;Wanted Lending
                {lending && lendingToken ? (
                  <DisplayToken size={32} token={lendingToken} amount={lending.amount} className="text-xl" />
                ) : null}
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Payments Am.</div>
                <div className="text-base">{Number(collateralData?.paymentCount ?? 0)}</div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <div className="text-base">
                  {Number(collateralData?.numberOfLoanDays ?? 0)}{" "}
                  {pluralize("day", Number(collateralData?.numberOfLoanDays ?? 0))}
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Whitelist</div>
                <div className="text-base">{collateralData?.whitelist?.length > 0 ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Interest</div>
                <div className="text-base">
                  {thresholdLow(totalInterestOnLoan, 0.01, "< 0.01")} {lendingToken?.symbol} (
                  {percent({ value: collateralData?.interest ?? 0 })})
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Each Payment Am.</div>
                <div className="text-base">
                  {amountDuePerPayment.toFixed(2)} {lendingToken?.symbol}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button variant="action" className="px-16">
                Approve Offer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
