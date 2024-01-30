"use client"

import createdOfferABI from "@/abis/v2/createdOffer.json"
import { PersonIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayToken from "@/components/ux/display-token"
import RedirectToDashboardShortly from "@/components/ux/redirect-to-dashboard-shortly"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useOffer } from "@/hooks/useOffer"
import { dollars, percent, thresholdLow } from "@/lib/display"
import { DISCORD_INVITE_URL } from "@/services/constants"
import { useMachine } from "@xstate/react"
import { CheckCircle, ExternalLink, XCircle } from "lucide-react"
import pluralize from "pluralize"
import { Address, useConfig } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import BorrowOfferBreadcrumbs from "./components/breadcrumbs"
import BorrowOfferChart from "./components/chart"
import BorrowOfferStats from "./components/stats"
import { machine } from "./owner-machine"

export default function BorrowOfferIsOwner({ params }: { params: { borrowOfferAddress: Address } }) {
  const borrowOfferAddress = params.borrowOfferAddress
  const currentChain = useCurrentChain()
  const config = useConfig()
  const { toast } = useToast()
  const { address } = useControlledAddress()
  const { data: offer } = useOffer(address, borrowOfferAddress)

  const principle = offer?.principle
  const collateral = offer?.collateral
  const principleToken = principle ? principle?.token : undefined
  const collateralToken = collateral ? collateral?.token : undefined

  const cancelOffer = async () => {
    try {
      const { request } = await config.publicClient.simulateContract({
        address: borrowOfferAddress,
        functionName: "cancelOffer",
        abi: createdOfferABI,
        args: [],
        account: address,
      })
      console.log("cancelOffer→request", request)

      const executed = await writeContract(request)
      console.log("cancelOffer→executed", executed)
      writeContract

      toast({
        variant: "success",
        title: "Offer Cancelled",
        description: "You have cancelled the offer.",
        // tx: executed,
      })
      return executed
    } catch (error) {
      console.log("cancelOffer→error", error)
      throw error
    }
  }

  // STATE MACHINE
  // OWNER - CANCEL OFFER
  const [state, send] = useMachine(
    machine.provide({
      actors: {
        cancelOffer: fromPromise(cancelOffer),
      },
    })
  )

  const totalLoan = Number(principle?.amount ?? 0)
  const totalInterestOnLoan = Number(offer?.interest ?? 0) * Number(principle?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(offer?.paymentCount ?? 1)

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
        <BorrowOfferBreadcrumbs principleToken={principleToken} />
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">Borrow Offer</h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
            <BorrowOfferStats principle={principle} offer={offer} />
          </div>
          <div>
            <BorrowOfferChart
              principleToken={principleToken}
              collateralToken={collateralToken}
              principleAmount={principle?.amount}
              collateralAmount={offer?.collateral?.amount}
            />
          </div>
        </div>
        <div className="space-y-8 max-w-xl w-full justify-self xl:ml-14">
          <div className="grid grid-cols-2 justify-between gap-8 mt-1">
            <div className="bg-[#21232B]/40 border-2 border-white/10 p-3 w-full rounded-md flex gap-2 items-center justify-center ">
              You are the Owner
              <PersonIcon className="w-6 h-6" />
            </div>
            <div>
              <ShowWhenTrue when={state.matches("idle")}>
                <Button
                  variant="action"
                  className="h-full w-full text-base"
                  onClick={() => {
                    send({ type: "cancel" })
                  }}
                >
                  Cancel Offer
                </Button>
              </ShowWhenTrue>

              <ShowWhenTrue when={state.matches("error")}>
                <Button
                  variant="error"
                  className="h-full w-full gap-2"
                  onClick={() => {
                    send({ type: "retry" })
                  }}
                >
                  <XCircle className="h-5 w-5" /> Cancel Failed - Retry?
                </Button>
              </ShowWhenTrue>

              <ShowWhenTrue when={state.matches("cancelling")}>
                <Button variant="action" className="h-full w-full">
                  Cancelling
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </ShowWhenTrue>

              <ShowWhenTrue when={state.matches("cancelled")}>
                <div className="h-full w-full inline-flex bg-success text-white gap-2 items-center justify-center border border-white/25 rounded-md">
                  <CheckCircle className="w-5 h-5" /> Cancelled
                </div>
              </ShowWhenTrue>
            </div>
          </div>

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
