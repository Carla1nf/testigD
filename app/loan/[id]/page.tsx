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
import { createActor, fromPromise } from "xstate"
import { useMachine } from "@xstate/react"
import { dollars, loanStatus, shortAddress, thresholdLow } from "@/lib/display"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { cn, fixedDecimals } from "@/lib/utils"
import DaysHours from "@/components/ux/deadline-datetime"
import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import dayjs from "dayjs"
import { calcCollateralsPriceHistory, calcPriceHistory } from "@/lib/chart"
import { Button } from "@/components/ui/button"
import TokenImage from "@/components/ux/token-image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { PersonIcon, SpinnerIcon } from "@/components/icons"
import pluralize from "pluralize"
import DisplayToken from "@/components/ux/display-token"
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

  const [loanState, loanSend] = useMachine(
    machine.provide({
      actors: {
        claimLentTokens: fromPromise(() => Promise.resolve(true)),
      },
    })
  )

  console.log("loanState.value", loanState.value)
  console.log("loan", loan)

  const lending = loan?.lending
  const lendingToken = lending ? lending?.token : undefined
  const lendingPrices = useHistoricalTokenPrices(currentChain.slug, loan?.lending?.address)
  const collateral0 = loan?.collaterals[0] ?? undefined
  const collateral0Token = collateral0 ? collateral0?.token : undefined
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, collateral0?.address)
  const collateral1 = loan?.collaterals[1] ?? undefined
  const collateral1Token = collateral1 ? collateral0?.token : undefined
  const collateral1Prices = useHistoricalTokenPrices(currentChain.slug, collateral1?.address)

  const timestamps = lendingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    return [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
  }, [currentChain])

  useEffect(() => {
    if (!loan) {
      return
    }
    // users can change wallets so let's stay on top of that
    if (loan?.lender === address) {
      loanSend({ type: "is.lender" })
      // now fill in the other details

      // fake unclaimed payments
      // loanSend({ type: "loan.has.tokens.to.claim" })
      // loanSend({ type: "lender.claim.lent.tokens" })

      // 1. how do we know there is a claim available and how much?
      if (loan?.claimableDebt > 0) {
        loanSend({ type: "loan.has.tokens.to.claim" })
      }
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
  const displayLoanStatus = loanStatus(Number(loan?.deadlineNext))

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

          {/* Lender unclaimed payments available */}
          <ShowWhenTrue when={loanState.matches("lender.claim.available")}>
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
              <Button variant="action" className="px-8">
                Claim debt
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Lender claiming unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender.claim.claimingLentTokens")}>
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
              <Button variant="action" className="px-8">
                Claiming debt
                <SpinnerIcon className="ml-2 animate-spin-slow" />
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Lender error claiming unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender.claim.errorClaimingLentTokens")}>
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
              <Button
                variant="error"
                className="px-8 gap-2"
                onClick={() => {
                  loanSend({ type: "lender.retry" })
                }}
              >
                <XCircle className="h-5 w-5" /> Claim Failed - Retry?
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Lender claimed unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender.claim.completed")}>
            <div className="rounded-md border-[#58353D] border bg-[#2C2B2B] p-4 px-6 flex gap-4 justify-between items-center">
              <div>Unclaimed payments</div>
              <Button variant="success" className="px-8 gap-2">
                <CheckCircle className="w-5 h-5" />
                Claimed
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Alert */}
          <ShowWhenTrue when={loanState.matches("borrower")}>
            <Alert variant="warning" className="mt-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              <AlertTitle>Please note</AlertTitle>
              <AlertDescription>
                if any payment is not paid according to the agreed terms, the lender reserves the right to claim the
                collateral provided as security for the loan.
              </AlertDescription>
            </Alert>
          </ShowWhenTrue>
        </div>
        <div className="space-y-8 max-w-xl w-full">
          <ShowWhenTrue when={loanState.matches("lender")}>
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              You are the lender
              <PersonIcon className="w-6 h-6" />
            </div>
          </ShowWhenTrue>

          <ShowWhenTrue when={loanState.matches("borrower")}>
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              You are the borrower
              <PersonIcon className="w-6 h-6" />
            </div>
          </ShowWhenTrue>

          {/* Form Panel */}
          <div className="bg-[#32282D] border border-[#743A49] p-8 rounded-md">
            <div className="text-xl mb-4 font-bold">Loan</div>
            {/* Status row */}
            <div className="grid grid-cols-2 justify-between gap-8 mb-8">
              <div className="flex flex-col">
                <div className="">Status</div>
                <div className={cn(displayLoanStatus.className, "font-bold text-lg")}>
                  {displayLoanStatus.displayText}
                </div>
              </div>

              <div>
                <div>Next Payment</div>
                <DaysHours deadline={loan?.deadline} className={cn(displayLoanStatus.className, "font-bold text-lg")} />
              </div>
            </div>
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>
                  Collateral
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: loan?.totalCollateralValue ?? 0 })}
                  </span>
                </div>
                <div className="-ml-[2px]">
                  {collateral0 && collateral0Token ? (
                    <DisplayToken size={32} token={collateral0Token} amount={collateral0.amount} className="text-xl" />
                  ) : null}
                  {collateral1 && collateral1Token ? (
                    <DisplayToken size={32} token={collateral1Token} amount={collateral1.amount} className="text-xl" />
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  Debt
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: loan?.lending?.valueUsd ?? 0 })}
                  </span>
                </div>

                {lending && lendingToken ? (
                  <div className="-ml-[2px]">
                    <DisplayToken size={32} token={lendingToken} amount={lending.amount} className="text-xl" />
                  </div>
                ) : null}
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <div className="text-base">
                  {Number(loan?.numberOfLoanDays ?? 0)} {pluralize("day", Number(loan?.numberOfLoanDays ?? 0))}
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Paid</div>
                <div className="text-base">{Number(loan?.paymentsPaid)}</div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Payments</div>
                <div className="text-base">{Number(loan?.paymentCount ?? 0)}</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Each Payment</div>
                <div className="text-base">
                  <DisplayToken
                    size={20}
                    token={lendingToken}
                    amount={loan?.eachPayment}
                    className=""
                    displayOrder="AmountNameIcon"
                  />
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Debt Left</div>
                <div className="text-base">
                  <DisplayToken
                    size={20}
                    token={lendingToken}
                    amount={loan?.debtLeft}
                    className=""
                    displayOrder="AmountNameIcon"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex justify-center">Buttons</div>
          </div>
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
