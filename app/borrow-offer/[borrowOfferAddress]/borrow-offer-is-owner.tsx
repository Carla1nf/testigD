"use client"

import { PersonIcon, PriceIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import RedirectToDashboardShortly from "@/components/ux/redirect-to-dashboard-shortly"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import { useOffer } from "@/hooks/useOffer"
import { calcCollateralsPriceHistory, calcPriceHistory } from "@/lib/chart"
import { DEBITA_ADDRESS } from "@/lib/contracts"
import { dollars, ltv, percent, thresholdLow } from "@/lib/display"
import { DISCORD_INVITE_URL } from "@/services/constants"
import { useMachine } from "@xstate/react"
import dayjs from "dayjs"
import { CheckCircle, ExternalLink, XCircle } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import pluralize from "pluralize"
import { useEffect, useMemo } from "react"
import { Address, useConfig } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import debitaAbi from "../../../abis/debita.json"
import { borrowOfferMachine } from "./borrow-offer-machine"

const LoanChart = dynamic(() => import("@/components/charts/loan-chart"), { ssr: false })
const ChartWrapper = dynamic(() => import("@/components/charts/chart-wrapper"), { ssr: false })

export default function BorrowOfferIsOwner({ params }: { params: { borrowOfferAddress: Address } }) {
  const borrowOfferAddress = params.borrowOfferAddress
  const config = useConfig()
  const { toast } = useToast()
  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: offer } = useOffer(address, borrowOfferAddress)

  const isOwnerConnected = address === offer?.owner

  const principle = offer?.principle
  const collateral = offer?.collateral
  const principleToken = principle ? principle?.token : undefined
  const collateralToken = collateral ? collateral?.token : undefined
  const principlePrices = useHistoricalTokenPrices(currentChain.slug, principleToken?.address as Address)
  const collateralPrices = useHistoricalTokenPrices(currentChain.slug, collateralToken?.address as Address)
  const timestamps = principlePrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  const cancelOffer = async () => {
    try {
      const { request } = await config.publicClient.simulateContract({
        address: DEBITA_ADDRESS,
        functionName: "cancelCollateralOffer",
        abi: debitaAbi,
        args: [borrowOfferAddress],
        account: address,
        gas: BigInt(900000),
      })
      // console.log("cancelLenderOffer→request", request)

      const executed = await writeContract(request)
      console.log("cancelLenderOffer→executed", executed)
      writeContract

      toast({
        variant: "success",
        title: "Offer Cancelled",
        description: "You have cancelled the offer.",
        // tx: executed,
      })
      return executed
    } catch (error) {
      console.log("cancelLenderOffer→error", error)
      throw error
    }
  }

  // STATE MACHINE
  // OWNER - CANCEL OFFER
  const [borrowMachineState, borrowMachineSend] = useMachine(
    borrowOfferMachine.provide({
      actors: {
        cancelBorrowOffer: fromPromise(cancelOffer),
      },
      actions: {
        ownerCancelledOffer: (params) => {
          console.log("actions→ownerCancelledOffer→params", params)
        },
      },
    })
  )

  // STATE MACHINE CONTROL
  useEffect(() => {
    if (isOwnerConnected && borrowMachineState.matches("isNotOwner")) {
      borrowMachineSend({ type: "owner" })
    }
  }, [isOwnerConnected, borrowMachineState, borrowMachineSend])

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    const result = [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
    if (principleToken) {
      result.push(
        <Link href={`/lend/`} className="hover:text-white/75" key="lending-market">
          Lending Market
        </Link>
      )
      result.push(
        <Link href={`/lend/${principleToken?.address}`} key="token">
          <DisplayToken
            size={18}
            token={principleToken}
            chainSlug={currentChain.slug}
            className="hover:text-white/75"
          />
        </Link>
      )
      return result
    }
    return []
  }, [currentChain, principleToken])

  const totalLoan = Number(principle?.amount ?? 0)
  const totalInterestOnLoan = Number(offer?.interest ?? 0) * Number(principle?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(offer?.paymentCount ?? 1)

  // CHARTING
  // DATA STRUCTURE
  const chartValues = {
    historicalLender: calcPriceHistory(principlePrices, principle?.amount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(collateralPrices, offer?.collateral?.amount ?? 0),
    timestamps,
  }

  if (offer === null) {
    return (
      <RedirectToDashboardShortly
        title="Borrow offer not found"
        description={
          <>
            <div className="mb-4">
              We are unable to find borrow offer {borrowOfferAddress}, it appears to have either already been accepted
              or may have never existed.
            </div>
            Please contact us in our{" "}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="nofollow noreferrer"
              className="text-pink-500 hover:underline flex-inline items-end gap-1"
            >
              Discord <ExternalLink className="w-4 h-4 mb-[4px] inline" />
            </a>{" "}
            if you need further assistance.
          </>
        }
      />
    )
  }

  // RENDERING
  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">Borrow Offer</h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
            <div className="grid grid-cols-3 gap-8">
              <Stat value={ltv(Number(offer?.ltv))} title={"LTV"} Icon={null} />
              <Stat
                value={dollars({ value: Number(principle?.valueUsd) })}
                title={"Lending"}
                Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
              />
              <Stat
                value={dollars({ value: Number(offer?.totalCollateralValue) })}
                title={"Collateral"}
                Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
              />
            </div>
          </div>
          <div>
            <ChartWrapper>
              <LoanChart loanData={chartValues} />
            </ChartWrapper>
          </div>
        </div>
        <div className="space-y-8 max-w-xl w-full justify-self xl:ml-14">
          {/* Owners can cancel the offer */}
          <ShowWhenTrue when={borrowMachineState.matches("isOwner")}>
            <div className="grid grid-cols-2 justify-between gap-8 mt-1">
              <div className="bg-[#21232B]/40 border-2 border-white/10 p-3 w-full rounded-md flex gap-2 items-center justify-center ">
                You are the Owner
                <PersonIcon className="w-6 h-6" />
                {/* {shortAddress(offer?.owner)} */}
              </div>
              <div>
                {/* Cancel the offer */}
                <ShowWhenTrue when={borrowMachineState.matches("isOwner.idle")}>
                  <Button
                    variant="action"
                    className="h-full w-full text-base"
                    onClick={() => {
                      borrowMachineSend({ type: "owner.cancel" })
                    }}
                  >
                    Cancel Offer
                  </Button>
                </ShowWhenTrue>
                <ShowWhenTrue when={borrowMachineState.matches("isOwner.error")}>
                  <Button
                    variant="error"
                    className="h-full w-full gap-2"
                    onClick={() => {
                      borrowMachineSend({ type: "owner.retry" })
                    }}
                  >
                    <XCircle className="h-5 w-5" /> Cancel Failed - Retry?
                  </Button>
                </ShowWhenTrue>

                {/* Cancelling the offer */}
                <ShowWhenTrue when={borrowMachineState.matches("isOwner.cancelling")}>
                  <Button variant="action" className="h-full w-full">
                    Cancelling
                    <SpinnerIcon className="ml-2 animate-spin-slow" />
                  </Button>
                </ShowWhenTrue>

                {/* Offer cancelled */}
                <ShowWhenTrue when={borrowMachineState.matches("isOwner.cancelled")}>
                  <div className="h-full w-full inline-flex bg-success text-white gap-2 items-center justify-center border border-white/25 rounded-md">
                    <CheckCircle className="w-5 h-5" /> Cancelled
                  </div>
                </ShowWhenTrue>
              </div>
            </div>
          </ShowWhenTrue>

          {/* Form Panel */}
          <div className="bg-[#32282D]/40 border border-[#743A49] p-8 rounded-md">
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>
                  Secured collateral
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: offer?.totalCollateralValue ?? 0 })}
                  </span>
                </div>
                <div className="-ml-[2px]">
                  {collateral && collateralToken ? (
                    <DisplayToken
                      size={32}
                      token={collateralToken}
                      amount={collateral.amount}
                      chainSlug={currentChain.slug}
                      className="text-xl"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  Wanted Lending
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: Number(principle?.valueUsd ?? 0) })}
                  </span>
                </div>

                {principle && principleToken ? (
                  <div className="-ml-[2px]">
                    <DisplayToken
                      size={32}
                      token={principleToken}
                      amount={principle.amount}
                      chainSlug={currentChain.slug}
                      className="text-xl"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Payments Am.</div>
                <div className="text-base">{Number(offer?.paymentCount ?? 0)}</div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <div className="text-base">
                  {Number(offer?.numberOfLoanDays ?? 0)} {pluralize("day", Number(offer?.numberOfLoanDays ?? 0))}
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Whitelist</div>
                <div className="text-base">n/a</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Interest</div>
                <div className="text-base">
                  {thresholdLow(totalInterestOnLoan, 0.01, "< 0.01")} {principleToken?.symbol} (
                  {percent({ value: offer?.interest ?? 0 })})
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Each Payment Am.</div>
                <div className="text-base">
                  {amountDuePerPayment.toFixed(2)} {principleToken?.symbol}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
