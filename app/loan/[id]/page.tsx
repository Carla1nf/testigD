"use client"

import { useToast } from "@/components/ui/use-toast"
import DisplayNetwork from "@/components/ux/display-network"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useConfig } from "wagmi"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import { useEffect, useMemo } from "react"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { machine } from "./loan-machine"
import { useLoanData } from "@/hooks/useLoanData"
import { ZERO_ADDRESS } from "@/services/constants"
import { createActor } from "xstate"
import { useMachine } from "@xstate/react"
import { dollars, shortAddress } from "@/lib/display"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { fixedDecimals } from "@/lib/utils"
import DaysHours from "@/components/ux/deadline-datetime"
import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import dayjs from "dayjs"
import { calcCollateralsPriceHistory, calcPriceHistory } from "@/lib/chart"
import { Button } from "@/components/ui/button"
import TokenImage from "@/components/ux/token-image"
/**
 * This page shows the suer the FULL details of the loan
 *
 * Owners/Lenders can claim the debt or retrieve their collateral
 * Borrowers can repay their loan (one or more times if multiple payments are due)
 *
 */
export default function Loan({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const config = useConfig()
  const { toast } = useToast()

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: loan } = useLoanData(id)

  const [loanState, loanSend] = useMachine(machine, {})

  console.log("loanState.value", loanState.value)
  console.log("loan", loan)

  const lendingPrices = useHistoricalTokenPrices(currentChain.slug, loan?.lending?.address)
  const collateral0 = loan?.collaterals[0] ?? undefined
  const collateral1 = loan?.collaterals[1] ?? undefined
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, collateral0?.address)
  const collateral1Prices = useHistoricalTokenPrices(currentChain.slug, collateral1?.address)

  const timestamps = lendingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    return [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
  }, [currentChain])

  useEffect(() => {
    // users can change wallets so let's stay on top of that
    if (loan?.lender === address) {
      loanSend({ type: "is.lender" })
      // now fill in the other details
    } else if (loan?.borrower === address) {
      loanSend({ type: "is.borrower" })
      // now fill in the other details
    } else {
      loanSend({ type: "is.viewer" })
    }
  }, [address, loan])

  const displayCollateralValue = dollars({ value: loan?.totalCollateralValue })
  const displayDebtValue = dollars({ value: loan?.lending?.amount })
  const displayLtv = loan?.ltv.toFixed(2)
  const displayDeadlineValue = Number(loan?.deadline) ?? 0

  // CHARTING
  // DATA STRUCTURE
  const chartValues = {
    historicalLender: calcPriceHistory(lendingPrices, loan?.lending?.amount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      Number(collateral0?.amount ?? 0),
      collateral1Prices,
      Number(collateral1?.amount ?? 0)
    ),
    timestamps,
  }

  // RENDERING
  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">
          Debita Loan #{Number(id)}
        </h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          {/* Display Debt/Collateral owners */}
          <div className="flex space-between gap-8 mb-8">
            <div>Lender {shortAddress(loan?.lender)}</div>
            <div>Borrower {shortAddress(loan?.borrower)}</div>
          </div>

          {/* Loan Stats */}
          <div className="flex justify-between gap-8 w-full">
            <ShowWhenTrue when={loanState.matches("lender") || loanState.matches("viewer")}>
              <LtvStat title="LTV" value={displayLtv} />
              <DebtStat title="Debt" value={displayDebtValue} />
              <CollateralStat title="Collateral" value={displayCollateralValue} />
              <DeadlineStat title="Final deadline" deadline={displayDeadlineValue} />
            </ShowWhenTrue>
            <ShowWhenTrue when={loanState.matches("borrower")}>
              <LtvStat title="LTV" value={displayLtv} />
              <DebtStat title="My Debt" value={displayDebtValue} />
              <CollateralStat title="Collateral" value={displayCollateralValue} />
              <DeadlineStat title="Final deadline" deadline={displayDeadlineValue} />
            </ShowWhenTrue>
          </div>

          <div>
            {/* Carl - make this more like your current chart, I've just reused this for now to get some data on screen */}
            <ChartWrapper>
              <LoanChart loanData={chartValues} />
            </ChartWrapper>
          </div>

          {/* Lender unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender")}>
            <div className="rounded-md border-[#58353D] border bg-[#2C2B2B] p-4 px-6 flex gap-4 justify-between items-center">
              <div>Unclaimed payments</div>
              <div className="flex gap-2 items-center">
                <div>{dollars({ value: 0 })}</div>
                <TokenImage
                  symbol={loan?.lending?.token?.symbol}
                  chainSlug={currentChain?.slug}
                  width={24}
                  height={24}
                />
              </div>
              <Button variant="action" className="px-12">
                Claim debt
              </Button>
            </div>
          </ShowWhenTrue>
        </div>
        <div className="space-y-8 max-w-xl w-full">
          <div></div>
        </div>
      </div>
    </>
  )
}

const LtvStat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

const DebtStat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

const CollateralStat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

const DeadlineStat = ({ title, deadline }: { title: string; deadline: number }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">
        <DaysHours deadline={deadline} />
      </div>
    </div>
  )
}
