"use client"

import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import { PersonIcon, PriceIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import RedirectToDashboardShortly from "@/components/ux/redirect-to-dashboard-shortly"
import Stat from "@/components/ux/stat"
import createdOfferABI from "@/abis/v2/createdOffer.json";
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import { useOfferLenderData } from "@/hooks/useOfferLenderData"
import { DEBITA_ADDRESS, OFFER_CREATED_ADDRESS } from "@/lib/contracts"
import { dollars, ltv, percent, shortAddress, thresholdLow, yesNo } from "@/lib/display"
import { fixedDecimals } from "@/lib/utils"
import { DISCORD_INVITE_URL, ZERO_ADDRESS } from "@/services/constants"
import { useMachine } from "@xstate/react"
import dayjs from "dayjs"
import { CheckCircle, ExternalLink, Info, XCircle } from "lucide-react"
import Link from "next/link"
import pluralize from "pluralize"
import { useEffect, useMemo, useRef, useState } from "react"
import { Address, useConfig, useContractRead } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import debitaAbi from "../../../abis/debita.json"
import erc20Abi from "../../../abis/erc20.json"
import { lendOfferMachine } from "./lend-offer-machine"

import { useToast } from "@/components/ui/use-toast"
import { prettifyRpcError } from "@/lib/prettify-rpc-errors"
import { balanceOf, toDecimals } from "@/lib/erc20"

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

function getAcceptCollateralOfferValue(collateralData: any) {
  if (!collateralData) {
    return 0
  }
  const collaterals = collateralData?.collaterals

  const isCollateralZero = collaterals?.address === ZERO_ADDRESS


  if (isCollateralZero) {
    return Number(collaterals[0].amountRaw)
  }

  return 0
}

function getAcceptLendingOfferValue(values: any) {
  if (!values) {
    return 0
  }
  if (values?.borrowing?.address === ZERO_ADDRESS) {
    return Number(values?.borrowing?.amount ?? 0)
  }

  return 0
}

export default function LendOffer({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const config = useConfig()
  const { toast } = useToast()
  const [amountToBorrow, setAmountToBorrow] = useState(0);

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data } = useOfferLenderData(address, id)
  const isOwnerConnected = address === data?.owner
  console.log(data, "DATAA");
  // console.log("data", data)

  const borrowing = data?.borrowing
  const collateral0 = data?.collaterals

  const borrowingToken = borrowing ? borrowing?.token : undefined
  const collateral0Token = collateral0 ? collateral0?.token : undefined

  const borrowingPrices = useHistoricalTokenPrices(currentChain.slug, borrowingToken?.address as Address)
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, collateral0Token?.address as Address)

  const timestamps = borrowingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  /* 
   --- NEW V2 TO IMPLEMENT ---
  
   const { request } = await config.publicClient.simulateContract({
        address: OFFER_CREATED_ADDRESS,
        functionName: "editOffer",
        abi: createdOfferABI,
        args: [[newAmountLending, newAmountCollateral], [newInterest,
        newPaymentCount, newTimelap], newVeValue, _newInterestRateForNFT],
        account: address     // gas: BigInt(900000),
        // chainId: currentChain?.chainId,
      })
        
        // this function is not live on the current version of the contract -- will be in the next one
        
         const { request } = await config.publicClient.simulateContract({
        address: OFFER_CREATED_ADDRESS,
        functionName: "interactPerpetual",
        abi: createdOfferABI,
        args: [newBoolPerpetual],
        account: address     // gas: BigInt(900000),
        // chainId: currentChain?.chainId,
      })
  */

  // check if we have the allowance to spend the collateral token
  const { data: currentCollateral0TokenAllowance } = useContractRead({
    address: (collateral0?.address ?? "") as Address,
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, OFFER_CREATED_ADDRESS],
  })


  const cancelOffer = async () => {
    try {
      const { request } = await config.publicClient.simulateContract({
        address: DEBITA_ADDRESS,
        functionName: "cancelLenderOffer",
        abi: debitaAbi,
        args: [id],
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
      if (collateral0?.address === ZERO_ADDRESS) {
        return true
      }

      // console.log("collateral0", collateral0)

      const { request } = await config.publicClient.simulateContract({
        address: (collateral0?.address ?? "") as Address,
        functionName: "approve",
        abi: erc20Abi,
        args: [OFFER_CREATED_ADDRESS, BigInt(collateral0?.amountRaw ?? 0)],
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
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Allowance Error",
        description: prettifyRpcError({ error, nativeTokenSymbol: currentChain?.symbol }),
        // tx: executed,
      })
      console.log("increaseAllowance→error", error)
      throw error
    }
  }

  const userAcceptOffer = async () => {
    try {
      // Check the user has enough in wallet to perform the loan
      if (collateral0) {
        const collateralBalance0 = await balanceOf({
          address: collateral0?.address as Address,
          account: address as Address,
        })
        /*
          ON V2 WE DONT NEED TO CHECK ALL THE BALANCE JUST THE PORCENTAGE
 
        if (collateral0 && collateralBalance0 < collateral0?.amountRaw) {
           throw `Insufficient ${collateral0Token?.symbol} balance`
         } */
      }


      const { request } = await config.publicClient.simulateContract({
        address: OFFER_CREATED_ADDRESS,
        functionName: "acceptOfferAsBorrower",
        abi: createdOfferABI,
        args: [toDecimals(amountToBorrow, data?.collaterals.token?.decimals ?? 0), 0],
        account: address     // gas: BigInt(900000),
        // chainId: currentChain?.chainId,
      })
      // console.log("userAcceptOffer→request", request)

      const executed = await writeContract(request)
      console.log("userAcceptOffer→executed", executed)

      toast({
        variant: "success",
        title: "Offer Accepted",
        description: `You have accepted the offer, the borrowed ${borrowingToken?.symbol} is now in your wallet.`,
        // tx: executed,
      })
      return executed
    } catch (error: any) {
      console.log("userAcceptOffer→error", error)
      toast({
        variant: "error",
        title: "Error Accepting Offer",
        description: prettifyRpcError({ error, nativeTokenSymbol: currentChain?.symbol }),
        // tx: executed,
      })
      throw error
    }
  }

  // STATE MACHINE
  // OWNER - CANCEL OFFER
  // USER - ACCEPT OFFER
  const [lendMachineState, lendMachineSend] = useMachine(
    lendOfferMachine.provide({
      actors: {
        acceptOffer: fromPromise(userAcceptOffer),
        cancelOffer: fromPromise(cancelOffer),
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

  // STATE MACHINE CONTROL
  // Connect the machine to the current on-chain state
  useEffect(() => {
    // if the user is not the owner
    if (isOwnerConnected && lendMachineState.matches("isNotOwner")) {
      lendMachineSend({ type: "owner" })
    }

    if (!isOwnerConnected) {
      lendMachineSend({ type: "not.owner" })

      // dual collateral mode
      if (collateral0) {
        // do they have the required allowance to pay for the offer?
        if (currentCollateral0TokenAllowance === undefined) {
          return
        }

        if (
          Number(currentCollateral0TokenAllowance) >= Number(collateral0?.amountRaw ?? 0)
        ) {
          lendMachineSend({ type: "user.has.allowance" })
          return
        }

        if (!lendMachineState.matches("isNotOwner.notEnoughAllowance")) {
          lendMachineSend({ type: "user.not.has.allowance" })
          return
        }
      }

      // single collateral mode
      if (collateral0) {
        // do they have the required allowance to pay for the offer?
        if (currentCollateral0TokenAllowance === undefined) {
          return
        }
        if (Number(currentCollateral0TokenAllowance) >= Number(collateral0?.amountRaw ?? 0)) {
          lendMachineSend({ type: "user.has.allowance" })
          return
        }
        if (!lendMachineState.matches("isNotOwner.notEnoughAllowance")) {
          lendMachineSend({ type: "user.not.has.allowance" })
        }
      }
    }
  }, [isOwnerConnected, currentCollateral0TokenAllowance])

  // console.log("state", lendMachineState.value)

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    const result = [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
    if (borrowingToken) {
      result.push(
        <Link href={`/borrow/`} className="hover:text-white/75" key="lending-market">
          Borrow Market
        </Link>
      )
      result.push(
        <Link href={`/borrow/${borrowingToken?.address}`} key="token">
          <DisplayToken size={18} token={borrowingToken} className="hover:text-white/75" />
        </Link>
      )
      return result
    }
    return []
  }, [currentChain, borrowingToken])

  const totalLoan = Number(borrowing?.amount ?? 0)
  const totalInterestOnLoan = Number(data?.interest ?? 0) * Number(borrowing?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(data?.paymentCount ?? 1)

  // CHARTING
  // DATA STRUCTURE
  const chartValues = {
    historicalLender: calcPriceHistory(borrowingPrices, borrowing?.amount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      data?.collaterals?.amount ?? 0,
      collateral0Prices,
      0,
    ),
    lastLender: 100.3,
    lastCollateral: 148.53,
    timestamps,
  }

  if (data === null) {
    return (
      <RedirectToDashboardShortly
        title="Borrow offer not found"
        description={
          <>
            <div className="mb-4">
              We are unable to find lending offer {id}, it appears to have either already been accepted or may have
              never existed.
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
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">Offer #{Number(id)}</h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16 animate-enter-div">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
            <div className="grid grid-cols-3 gap-8">
              <Stat value={ltv(Number(data?.ltv))} title={"LTV"} Icon={null} />

              <Stat
                value={dollars({ value: Number(data?.totalCollateralValue) })}
                title={"Collateral"}
                Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}

              />

              <Stat
                value={dollars({ value: Number(borrowing?.valueUsd) })}
                title={"Borrowing"}
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
        <div className="space-y-8 max-w-xl w-full xl:ml-16">
          {/* Owners can cancel the offer */}
          <ShowWhenTrue when={lendMachineState.matches("isOwner")}>
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
                You are the Owner
                <PersonIcon className="w-6 h-6" />
                {/* {shortAddress(collateralData?.owner)} */}
              </div>
              <div>
                {/* Cancel the offer */}
                <ShowWhenTrue when={lendMachineState.matches("isOwner.idle")}>
                  <Button
                    variant="action"
                    className="h-full w-full"
                    onClick={() => {
                      lendMachineSend({ type: "owner.cancel" })
                    }}
                  >
                    Cancel Offer
                  </Button>
                </ShowWhenTrue>
                <ShowWhenTrue when={lendMachineState.matches("isOwner.error")}>
                  <Button
                    variant="error"
                    className="h-full w-full gap-2"
                    onClick={() => {
                      lendMachineSend({ type: "owner.retry" })
                    }}
                  >
                    <XCircle className="h-5 w-5" /> Cancel Failed - Retry?
                  </Button>
                </ShowWhenTrue>

                {/* Cancelling the offer */}
                <ShowWhenTrue when={lendMachineState.matches("isOwner.cancelling")}>
                  <Button variant="action" className="h-full w-full">
                    Cancelling
                    <SpinnerIcon className="ml-2 animate-spin-slow" />
                  </Button>
                </ShowWhenTrue>

                {/* Offer cancelled */}
                <ShowWhenTrue when={lendMachineState.matches("isOwner.cancelled")}>
                  <div className="h-full w-full inline-flex bg-success text-white gap-2 items-center justify-center border border-white/25 rounded-md">
                    <CheckCircle className="w-5 h-5" /> Cancelled
                  </div>
                </ShowWhenTrue>
              </div>
            </div>
          </ShowWhenTrue>

          {/* Non owners can see who the owner is */}
          <ShowWhenTrue when={lendMachineState.matches("isNotOwner")}>
            <div className="flex justify-between gap-8">
              <div className="bg-[#21232B]/40 border-2 border-white/10 p-4 w-full rounded-xl flex gap-2 items-center justify-center  ">
                You are borrowing {borrowingToken?.symbol} from
                <PersonIcon className="w-6 h-6" />
                {shortAddress(data?.owner as Address)}
              </div>
            </div>
          </ShowWhenTrue>

          {/* Form Panel */}
          <div className="bg-[#32282D]/40 border border-[#743A49] p-8 rounded-xl shadow-xl shadow-[#32282D]/50">
            <div className="text-xl mb-4 font-bold">Lending Offer</div>
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>Provide Collateral</div>
                <div className="-ml-[px]">
                  {collateral0 && collateral0Token ? (
                    <DisplayToken size={32} token={collateral0Token} amount={collateral0.amount} className="text-xl" />
                  ) : null}

                </div>
                <div className="text-white/50 text-xs italic">
                  Collateral value: {dollars({ value: data?.totalCollateralValue ?? 0 })}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div>To Borrow</div>

                {borrowing && borrowingToken ? (
                  <div className="-ml-[4px]">
                    <DisplayToken size={32} token={borrowingToken} amount={borrowing.amount} className="text-xl" />
                  </div>
                ) : null}
                <div className="text-white/50 text-xs italic">
                  Borrow value: {dollars({ value: borrowing?.valueUsd ?? 0 })}
                </div>
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Payments Am.</div>
                <div className="text-base">{Number(data?.paymentCount ?? 0)}</div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <div className="text-base">
                  {Number(data?.numberOfLoanDays ?? 0)} {pluralize("day", Number(data?.numberOfLoanDays ?? 0))}
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Whitelist</div>
                <div className="text-base">{yesNo(data?.whitelist?.length)}</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Interest</div>
                <div className="text-base">
                  {thresholdLow(totalInterestOnLoan, 0.01, "< 0.01")} {borrowingToken?.symbol} (
                  {percent({ value: data?.interest ?? 0 })})
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Each Payment Am.</div>
                <div className="text-base">
                  {amountDuePerPayment.toFixed(2)} {borrowingToken?.symbol}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex justify-center">
              <ShowWhenTrue when={lendMachineState.matches("isNotOwner")}>
                <>
                  {/* Show the Increase Allowance button when the user doesn't not have enough allowance */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.notEnoughAllowance")}>
                    <Button
                      variant={"action"}
                      className="px-16"
                      onClick={async () => {
                        lendMachineSend({ type: "user.allowance.increase" })
                      }}
                    >
                      Increase Allowance
                    </Button>
                  </ShowWhenTrue>

                  {/* Show the Increasing Allowance spinner button while performing an increase allowance transaction */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.increaseAllowance")}>
                    <Button variant={"action"} className="px-16">
                      Increasing Allowance
                      <SpinnerIcon className="ml-2 animate-spin-slow" />
                    </Button>
                  </ShowWhenTrue>

                  {/* Increasing Allowance Failed - Allow the user to try increasing allowance again */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.increaseAllowanceError")}>
                    <Button
                      variant="error"
                      className="h-full w-full gap-2"
                      onClick={() => {
                        lendMachineSend({ type: "user.allowance.increase.retry" })
                      }}
                    >
                      <XCircle className="h-5 w-5" />
                      Increasing Allowance Failed - Retry?
                    </Button>
                  </ShowWhenTrue>

                  {/* User has enough allowance, show them the accept offer button */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.canAcceptOffer")}>
                   <div className="flex gap-10">
                   <input className="text-center rounded-lg text-sm px-4 py-2 bg-[#21232B]/40 border-2 border-white/10" placeholder={`Amount of ${data?.borrowing.token?.symbol}`} type="number" onChange={(e) => { setAmountToBorrow(Number(e.currentTarget.value)) }} />
                    <Button
                      variant={"action"}
                      className="px-16"
                      onClick={async () => {
                        lendMachineSend({ type: "user.accept.offer" })
                      }}
                    >
                      Accept Offer
                    </Button>
                   </div>
                  </ShowWhenTrue>

                  {/* Show the Accepting Offer spinner while we are accepting the offer */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.acceptingOffer")}>
                    <Button variant={"action"} className="px-16">
                      Accepting Offer...
                      <SpinnerIcon className="ml-2 animate-spin-slow" />
                    </Button>
                  </ShowWhenTrue>

                  {/* Accepted offer failed - Allow the user tor try accepting the offer again */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.acceptingOfferError")}>
                    <Button
                      variant="error"
                      className="h-full w-full gap-2"
                      onClick={() => {
                        lendMachineSend({ type: "user.accept.offer.retry" })
                      }}
                    >
                      <XCircle className="h-5 w-5" />
                      Accept Offer Failed - Retry?
                    </Button>
                  </ShowWhenTrue>

                  {/* The offer is accepted */}
                  <ShowWhenTrue when={lendMachineState.matches("isNotOwner.offerAccepted")}>
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
