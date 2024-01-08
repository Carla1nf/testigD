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
import { useOfferCollateralData } from "@/hooks/useOfferCollateralData"
import { calcCollateralsPriceHistory, calcPriceHistory } from "@/lib/chart"
import { DEBITA_ADDRESS } from "@/lib/contracts"
import { dollars, ltv, percent, shortAddress, thresholdLow } from "@/lib/display"
import { DISCORD_INVITE_URL, ZERO_ADDRESS } from "@/services/constants"
import { useMachine } from "@xstate/react"
import dayjs from "dayjs"
import { CheckCircle, ExternalLink, Info, XCircle } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import pluralize from "pluralize"
import { useEffect, useMemo } from "react"
import { Address, useConfig, useContractRead } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import debitaAbi from "../../../abis/debita.json"
import erc20Abi from "../../../abis/erc20.json"
import { borrowOfferMachine } from "./borrow-offer-machine"

const LoanChart = dynamic(() => import("@/components/charts/loan-chart"), { ssr: false })
const ChartWrapper = dynamic(() => import("@/components/charts/chart-wrapper"), { ssr: false })

// function getAcceptCollateralOfferValue(collateralData: any) {
//   if (!collateralData) {
//     return 0
//   }
//   const { collaterals } = collateralData
//   if (!Array.isArray(collaterals)) {
//     return 0
//   }
//   const hasFirstCollateral = collaterals.length > 0
//   const hasSecondCollateral = collaterals.length > 1
//   const isFirstAddressZero = hasFirstCollateral && collaterals[0]?.address === ZERO_ADDRESS
//   const isSecondAddressZero = hasSecondCollateral && collaterals[1]?.address === ZERO_ADDRESS

//   if (isSecondAddressZero && isFirstAddressZero) {
//     return Number(collaterals[0].amountRaw) + Number(collaterals[1].amountRaw)
//   }
//   if (isFirstAddressZero) {
//     return Number(collaterals[0].amountRaw)
//   }
//   if (isSecondAddressZero) {
//     return Number(collaterals[1].amountRaw)
//   }
//   return 0
// }

function getAcceptLendingOfferValue(collateralData: any) {
  if (!collateralData) {
    return 0
  }
  if (collateralData?.lending?.address === ZERO_ADDRESS) {
    return Number(collateralData?.lending?.amount ?? 0)
  }

  return 0
}

export default function BorrowOffer({ params }: { params: { borrowOfferAddress: Address } }) {
  const borrowOfferAddress = params.borrowOfferAddress
  const config = useConfig()
  const { toast } = useToast()

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: collateralData } = useOfferCollateralData(address, borrowOfferAddress)
  const isOwnerConnected = address === collateralData?.owner

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

  // check if we have the allowance to spend the lender token
  const { data: currentLendingTokenAllowance } = useContractRead({
    address: collateralData?.lending?.address ?? "",
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, DEBITA_ADDRESS],
  })

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

  const increaseAllowance = async () => {
    try {
      const { request } = await config.publicClient.simulateContract({
        address: collateralData?.lending?.address ?? "",
        functionName: "approve",
        abi: erc20Abi,
        args: [DEBITA_ADDRESS, BigInt(collateralData?.lending?.amountRaw ?? 0)],
        account: address,
      })
      // console.log("increaseAllowance→request", request)

      const executed = await writeContract(request)
      console.log("increaseAllowance→executed", executed)

      toast({
        variant: "success",
        title: "Allowance Increased",
        description: "You have increased the allowance and can now accept the offer.",
        // tx: executed,
      })
      return executed
    } catch (error) {
      console.log("increaseAllowance→error", error)
      throw error
    }
  }

  const userAcceptOffer = async () => {
    try {
      const value = getAcceptLendingOfferValue(collateralData)
      const { request } = await config.publicClient.simulateContract({
        address: DEBITA_ADDRESS,
        functionName: "acceptCollateralOffer",
        abi: debitaAbi,
        args: [borrowOfferAddress],
        account: address,
        value: BigInt(value),
        // gas: BigInt(900000),
        // chainId: currentChain?.chainId,
      })
      // console.log("userAcceptOffer→request", request)

      const executed = await writeContract(request)
      console.log("userAcceptOffer→executed", executed)

      toast({
        variant: "success",
        title: "Offer Accepted",
        description: "You have accepted the offer.",
        // tx: executed,
      })
      return executed
    } catch (error) {
      console.log("userAcceptOffer→error", error)
      throw error
    }
  }

  // STATE MACHINE
  // OWNER - CANCEL OFFER
  // USER - ACCEPT OFFER
  const [borrowMachineState, borrowMachineSend] = useMachine(
    borrowOfferMachine.provide({
      actors: {
        acceptOffer: fromPromise(userAcceptOffer),
        cancelBorrowOffer: fromPromise(cancelOffer),
        increaseAllowance: fromPromise(increaseAllowance),
      },
      actions: {
        userIncreasedAllowance: (params) => {
          console.log("action→userIncreasedAllowance→params", params)
        },
        userAcceptedOffer: (params) => {
          console.log("actions→userAcceptedOffer→params", params)
        },
        ownerCancelledOffer: (params) => {
          console.log("actions→ownerCancelledOffer→params", params)
        },
      },
    })
  )

  /**
   * These are the toast messages we need would display (taken from the old app)
   */

  {
    /* <ShowWhenTrue when={isAcceptCollateralOfferError}>
                <Alert variant="error" className="mt-8">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription> Transaction Failed. Please try again later.</AlertDescription>
                </Alert>
              </ShowWhenTrue>
              <ShowWhenTrue when={isAcceptCollateralOfferSuccess}>
                <Alert variant="success" className="mt-8">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>Transaction sent. You&apos;ll be redirected in a moment.</AlertDescription>
                </Alert>
              </ShowWhenTrue>
              <ShowWhenTrue when={isAcceptCollateralOfferLoading}>
                <Alert variant="warning" className="mt-8">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <AlertTitle>Waiting</AlertTitle>
                  <AlertDescription>Transaction sent. Waiting for a response.</AlertDescription>
                </Alert>
              </ShowWhenTrue> */
  }

  {
    /*           
          <ShowWhenTrue when={isCancelOfferSuccess}>
            <Alert variant="success" className="mt-8">
              <AlertCircle className="w-5 h-5 mr-2" />
              <AlertTitle>Cancelled</AlertTitle>
              <AlertDescription>You have cancelled this offer.</AlertDescription>
            </Alert>
          </ShowWhenTrue>
          <ShowWhenTrue when={isCancelOfferError}>
            <Alert variant="error" className="mt-8">
              <AlertCircle className="w-5 h-5 mr-2" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription> Transaction Failed. Please try again later.</AlertDescription>
            </Alert>
          </ShowWhenTrue>
          <ShowWhenTrue when={isCancelOfferLoading}>
            <Alert variant="warning" className="mt-8">
              <AlertCircle className="w-5 h-5 mr-2" />
              <AlertTitle>Waiting</AlertTitle>
              <AlertDescription>Transaction sent. Waiting for a response.</AlertDescription>
            </Alert>
          </ShowWhenTrue> */
  }

  // STATE MACHINE CONTROL
  // Connect the machine to the current on-chain state
  useEffect(() => {
    // if the user is not the owner
    if (isOwnerConnected && borrowMachineState.matches("isNotOwner")) {
      borrowMachineSend({ type: "owner" })
    }

    if (!isOwnerConnected) {
      borrowMachineSend({ type: "not.owner" })
      if (currentLendingTokenAllowance === undefined) {
        return
      }

      // do they have the required allowance to pay for the offer?
      if (Number(currentLendingTokenAllowance) >= Number(collateralData?.lending?.amount ?? 0)) {
        borrowMachineSend({ type: "user.has.allowance" })
      } else if (!borrowMachineState.matches("isNotOwner.notEnoughAllowance")) {
        borrowMachineSend({ type: "user.not.has.allowance" })
      }
    }
  }, [isOwnerConnected, currentLendingTokenAllowance])

  console.log("state", borrowMachineState.value)

  // BREADCRUMBS
  // CONFIG
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

  const totalLoan = Number(collateralData?.lending?.amount ?? 0)
  const totalInterestOnLoan = Number(collateralData?.interest ?? 0) * Number(lending?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(collateralData?.paymentCount ?? 1)

  // CHARTING
  // DATA STRUCTURE
  const chartValues = {
    historicalLender: calcPriceHistory(lendingPrices, collateralData?.lending?.amount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      collateralData?.collaterals[0]?.amount ?? 0,
      collateral1Prices,
      collateralData?.collaterals[1]?.amount ?? 0
    ),
    timestamps,
  }

  if (collateralData === null) {
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
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">Loan</h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
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
              <LoanChart loanData={chartValues} />
            </ChartWrapper>
          </div>
        </div>
        <div className="space-y-8 max-w-xl w-full justify-self xl:ml-14">
          {/* Owners can cancel the offer */}
          <ShowWhenTrue when={borrowMachineState.matches("isOwner")}>
            <div className="grid grid-cols-2 justify-between gap-8 mt-1">
              <div className="bg-[#21232B] border-2 border-white/10 p-3 w-full rounded-md flex gap-2 items-center justify-center ">
                You are the Owner
                <PersonIcon className="w-6 h-6" />
                {/* {shortAddress(collateralData?.owner)} */}
              </div>
              <div>
                {/* Cancel the offer */}
                <ShowWhenTrue when={borrowMachineState.matches("isOwner.idle")}>
                  <Button
                    variant="action"
                    className="h-full w-full"
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

          {/* Non owners can see who the owner is */}
          <ShowWhenTrue when={borrowMachineState.matches("isNotOwner")}>
            <div className="flex justify-between gap-8 mt-1">
              <div className="bg-[#21232B] border-2 border-white/10 p-3 w-full rounded-md flex gap-2 items-center justify-center ">
                You are lending to
                <PersonIcon className="w-6 h-6" />
                {shortAddress(collateralData?.owner)}
              </div>
            </div>
          </ShowWhenTrue>

          {/* Form Panel */}
          <div className="bg-[#32282D] border border-[#743A49] p-8 rounded-md">
            <div className="text-xl mb-4 font-bold">Borrow Offer</div>
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>
                  Collateral
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: collateralData?.totalCollateralValue ?? 0 })}
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
                  Wanted Lending
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: collateralData?.lending?.valueUsd ?? 0 })}
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

            {/* Loan details row */}
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

            {/* Buttons */}
            <div className="mt-8 flex justify-center">
              <ShowWhenTrue when={borrowMachineState.matches("isNotOwner")}>
                <>
                  {/* Show the Increase Allowance button when the user doesn't not have enough allowance */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.notEnoughAllowance")}>
                    <Button
                      variant={"action"}
                      className="px-16"
                      onClick={async () => {
                        borrowMachineSend({ type: "user.allowance.increase" })
                      }}
                    >
                      Increase Allowance
                    </Button>
                  </ShowWhenTrue>

                  {/* Show the Increasing Allowance spinner button while performing an increase allowance transaction */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.increaseAllowance")}>
                    <Button variant={"action"} className="px-16">
                      Increasing Allowance
                      <SpinnerIcon className="ml-2 animate-spin-slow" />
                    </Button>
                  </ShowWhenTrue>

                  {/* Increasing Allowance Failed - Allow the user to try increasing allowance again */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.increaseAllowanceError")}>
                    <Button
                      variant="error"
                      className="h-full w-full gap-2"
                      onClick={() => {
                        borrowMachineSend({ type: "user.allowance.increase.retry" })
                      }}
                    >
                      <XCircle className="h-5 w-5" />
                      Increasing Allowance Failed - Retry?
                    </Button>
                  </ShowWhenTrue>

                  {/* User has enough allowance, show them the accept offer button */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.canAcceptOffer")}>
                    <Button
                      variant={"action"}
                      className="px-16"
                      onClick={async () => {
                        borrowMachineSend({ type: "user.accept.offer" })
                      }}
                    >
                      Accept Offer
                    </Button>
                  </ShowWhenTrue>

                  {/* Show the Accepting Offer spinner while we are accepting the offer */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.acceptingOffer")}>
                    <Button variant={"action"} className="px-16">
                      Accepting Offer...
                      <SpinnerIcon className="ml-2 animate-spin-slow" />
                    </Button>
                  </ShowWhenTrue>

                  {/* Accepted offer failed - Allow the user tor try accepting the offer again */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.acceptingOfferError")}>
                    <Button
                      variant="error"
                      className="h-full w-full gap-2"
                      onClick={() => {
                        borrowMachineSend({ type: "user.accept.offer.retry" })
                      }}
                    >
                      <XCircle className="h-5 w-5" />
                      Accept Offer Failed - Retry?
                    </Button>
                  </ShowWhenTrue>

                  {/* The offer is accepted */}
                  <ShowWhenTrue when={borrowMachineState.matches("isNotOwner.offerAccepted")}>
                    <Button variant={"success"} className="px-16 gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Offer Accepted
                    </Button>
                  </ShowWhenTrue>
                </>
              </ShowWhenTrue>
            </div>
          </div>

          {/* Description panel */}
          {/* <Description /> */}
        </div>
      </div>
    </>
  )
}

/**
 * This panel will generate the borrow offer description from the passed collateral data
 *
 * The text is hard coded for now just to show what It coulkd look like
 * @returns
 */

const Description = () => {
  return (
    <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex flex-col gap-4 text-sm">
      <div className="flex flex-row gap-2 items-center text-base">
        <Info className="w-5 h-5" />
        Details
      </div>
      <div className="">
        You will lend 100 axlUSDC worth $100.00 against 450 FTM collateral worth $171.55 at 2% interest.
        <br />
        <br />
        After 40 days, one of the following scenarios will occur:
      </div>
      <dl className="border border-white/15 p-4 rounded-sm bg-[#181a20]">
        <dt className="font-bold mb-2">Successful repayment</dt>
        <dd className="mb-4">
          - The borrower repays the loan (and interest) after 40 days. You receive the 100 axlUSDC lent along with 2%
          interest for a total of 102 axlUSDC which is an effective APR of 18.25%
        </dd>

        <dt className="font-bold mb-2">Defaulted repayment</dt>
        <dd className="">
          - The borrower does not repay the loan and you can claim the collateral, this is equivalent to a purchase of
          450 FTM for $100.00 or $0.22 per FTM a 45% discount on the current price.
        </dd>
      </dl>
    </div>
  )
}
