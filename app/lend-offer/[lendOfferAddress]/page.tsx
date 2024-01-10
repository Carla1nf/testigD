"use client"

import createdOfferABI from "@/abis/v2/createdOffer.json"
import { PersonIcon, PriceIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenFalse, ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import RedirectToDashboardShortly from "@/components/ux/redirect-to-dashboard-shortly"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import { useOffer } from "@/hooks/useOffer"
import { dollars, ltv, percent, shortAddress, thresholdLow, yesNo } from "@/lib/display"
import { balanceOf, toDecimals } from "@/lib/erc20"
import { prettifyRpcError } from "@/lib/prettify-rpc-errors"
import { fixedDecimals } from "@/lib/utils"
import { DISCORD_INVITE_URL, ZERO_ADDRESS } from "@/services/constants"
import { useMachine } from "@xstate/react"
import dayjs from "dayjs"
import { CheckCircle, ExternalLink, Info, XCircle } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import pluralize from "pluralize"
import { useEffect, useMemo, useRef, useState } from "react"
import { Address, useConfig, useContractRead } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import erc20Abi from "../../../abis/erc20.json"
import { lendOfferMachine } from "./lend-offer-machine"

const LoanChart = dynamic(() => import("@/components/charts/loan-chart"), { ssr: false })
const ChartWrapper = dynamic(() => import("@/components/charts/chart-wrapper"), { ssr: false })

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
  if (values?.principle?.address === ZERO_ADDRESS) {
    return Number(values?.principle?.amount ?? 0)
  }

  return 0
}

export default function LendOffer({ params }: { params: { lendOfferAddress: Address } }) {
  const config = useConfig()
  const { toast } = useToast()
  const [amountToBorrow, setAmountToBorrow] = useState(0)
  const [editing, setEditing] = useState(false)
  const newCollateralAmount = useRef<HTMLInputElement>(null)
  const newBorrowAmount = useRef<HTMLInputElement>(null)
  const newPaymentCount = useRef<HTMLInputElement>(null)
  const newTimelap = useRef<HTMLInputElement>(null)
  const newInterest = useRef<HTMLInputElement>(null)
  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const lendOfferAddress = params.lendOfferAddress
  const OFFER_CREATED_ADDRESS = lendOfferAddress
  const { data: offer } = useOffer(address, lendOfferAddress)

  const principle = offer?.principle
  const collateral = offer?.collateral
  const collateralToken = collateral ? collateral?.token : undefined
  const borrowingToken = principle ? principle?.token : undefined
  const isOwnerConnected = address === offer?.owner

  const borrowingPrices = useHistoricalTokenPrices(currentChain.slug, borrowingToken?.address as Address)
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, collateralToken?.address as Address)
  const timestamps = borrowingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  // check if we have the allowance to spend the collateral token
  const { data: currentCollateral0TokenAllowance } = useContractRead({
    address: (collateral?.address ?? "") as Address,
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, OFFER_CREATED_ADDRESS],
  })

  const interactPerpetual = async () => {
    const { request } = await config.publicClient.simulateContract({
      address: OFFER_CREATED_ADDRESS,
      functionName: "interactPerpetual",
      abi: createdOfferABI,
      args: [!offer?.perpetual],
      account: address, // gas: BigInt(900000),
      // chainId: currentChain?.chainId,
    })
    const executed = await writeContract(request)
    console.log(executed)
  }

  const editOffer = async () => {
    const newBorrow = borrowingToken ? Number(newBorrowAmount.current?.value) * 10 ** borrowingToken?.decimals : 0

    const newCollateral = collateralToken
      ? Number(newCollateralAmount.current?.value) * 10 ** collateralToken?.decimals
      : 0
    const { request } = await config.publicClient.simulateContract({
      address: OFFER_CREATED_ADDRESS,
      functionName: "editOffer",
      abi: createdOfferABI,
      args: [
        [newBorrow, newCollateral],
        [
          Number(newInterest.current?.value) * 100,
          Number(newPaymentCount.current?.value),
          Number(newTimelap.current?.value) * 86400,
        ],
        0,
        0,
      ],
      account: address, // gas: BigInt(900000),
      // chainId: currentChain?.chainId,
    })

    const executed = await writeContract(request)
    console.log(executed)

    /* args: [[newAmountLending, newAmountCollateral], [newInterest,
      newPaymentCount, newTimelap], newVeValue, _newInterestRateForNFT], */
  }

  const cancelOffer = async () => {
    try {
      const { request } = await config.publicClient.simulateContract({
        address: OFFER_CREATED_ADDRESS,
        functionName: "cancelOffer",
        abi: createdOfferABI,
        args: [],
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
      if (collateral?.address === ZERO_ADDRESS) {
        return true
      }
      const { request } = await config.publicClient.simulateContract({
        address: (collateral?.address ?? "") as Address,
        functionName: "approve",
        abi: erc20Abi,
        args: [OFFER_CREATED_ADDRESS, BigInt(collateral?.amountRaw ?? 0)],
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
      if (collateral) {
        const collateralBalance0 = await balanceOf({
          address: collateral?.address as Address,
          account: address as Address,
        })
        /*
          ON V2 WE DON'T NEED TO CHECK ALL THE BALANCE JUST THE PERCENTAGE
 
        if (collateral && collateralBalance0 < collateral?.amountRaw) {
           throw `Insufficient ${collateral0Token?.symbol} balance`
         } */
      }

      const { request } = await config.publicClient.simulateContract({
        address: OFFER_CREATED_ADDRESS,
        functionName: "acceptOfferAsBorrower",
        abi: createdOfferABI,
        args: [toDecimals(amountToBorrow, collateralToken?.decimals ?? 0), 0],
        account: address,

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
      if (collateral) {
        // do they have the required allowance to pay for the offer?
        if (currentCollateral0TokenAllowance === undefined) {
          return
        }
        if (Number(currentCollateral0TokenAllowance) >= Number(collateral?.amountRaw ?? 0)) {
          lendMachineSend({ type: "user.has.allowance" })
          return
        }
        if (!lendMachineState.matches("isNotOwner.notEnoughAllowance")) {
          lendMachineSend({ type: "user.not.has.allowance" })
          return
        }
      }

      // single collateral mode
      if (collateral) {
        // do they have the required allowance to pay for the offer?
        if (currentCollateral0TokenAllowance === undefined) {
          return
        }
        if (Number(currentCollateral0TokenAllowance) >= Number(collateral?.amountRaw ?? 0)) {
          lendMachineSend({ type: "user.has.allowance" })
          return
        }
        if (!lendMachineState.matches("isNotOwner.notEnoughAllowance")) {
          lendMachineSend({ type: "user.not.has.allowance" })
        }
      }
    }
  }, [isOwnerConnected, currentCollateral0TokenAllowance, lendMachineState, lendMachineSend, collateral])

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
          <DisplayToken
            size={18}
            token={borrowingToken}
            className="hover:text-white/75"
            chainSlug={currentChain.slug}
          />
        </Link>
      )
      return result
    }
    return []
  }, [currentChain, borrowingToken])

  const totalLoan = Number(principle?.amount ?? 0)
  const totalInterestOnLoan = Number(offer?.interest ?? 0) * Number(principle?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(offer?.paymentCount ?? 1)

  // CHARTING
  // DATA STRUCTURE
  const chartValues = {
    historicalLender: calcPriceHistory(borrowingPrices, principle?.amount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      offer?.collateral?.amount ?? 0,
      collateral0Prices,
      0
    ),
    lastLender: 100.3,
    lastCollateral: 148.53,
    timestamps,
  }

  if (offer === null) {
    return (
      <RedirectToDashboardShortly
        title="Borrow offer not found"
        description={
          <>
            <div className="mb-4">
              We are unable to find lending offer {lendOfferAddress}, it appears to have either already been accepted or
              may have never existed.
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
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">
          {/* Offer #{lendOfferAddress} */}
          Offer
        </h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16 animate-enter-div">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
            <div className="grid grid-cols-3 gap-8">
              <Stat value={ltv(Number(offer?.ltv))} title={"LTV"} Icon={null} />

              <Stat
                value={dollars({ value: Number(offer?.totalCollateralValue) })}
                title={"Collateral"}
                Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
              />

              <Stat
                value={dollars({ value: Number(principle?.valueUsd) })}
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
                You could borrow {borrowingToken?.symbol} from
                <PersonIcon className="w-6 h-6" />
                {shortAddress(offer?.owner as Address)}
              </div>
            </div>
          </ShowWhenTrue>

          {/* Form Panel */}
          <div className="bg-[#32282D]/40 border border-[#743A49] p-8 rounded-xl shadow-xl shadow-[#392A31]/60">
            <div className="text-xl mb-4 font-bold flex items-center gap-5">
              Lending Offer
              <ShowWhenFalse when={lendMachineState.matches("isNotOwner")}>
                <div
                  onClick={async () => setEditing(!editing)}
                  className="bg-debitaPink/10 px-4 text-sm py-2 rounded-xl cursor-pointer text-gray-300"
                >
                  <div>{editing ? "Cancel" : "Edit Offer"}</div>
                </div>
              </ShowWhenFalse>
              <ShowWhenFalse when={lendMachineState.matches("isNotOwner")}>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    checked={offer?.perpetual}
                    onClick={() => interactPerpetual()}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Perpetual</span>
                </label>
              </ShowWhenFalse>
            </div>
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>Provide Collateral</div>
                <div className="-ml-[px]">
                  {collateral && collateralToken ? (
                    <>
                      {editing ? (
                        <div className="flex items-center gap-2 animate-enter-div">
                          <input
                            min={0}
                            max={offer?.isNFT[1] ? 1 : 10000000000000}
                            type="number"
                            ref={newCollateralAmount}
                            className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                            placeholder={`new ${collateralToken.symbol} amount`}
                            defaultValue={collateral.amount}
                          />
                          {collateralToken.symbol}
                        </div>
                      ) : (
                        <DisplayToken
                          size={32}
                          token={collateralToken}
                          amount={collateral.amount}
                          className="text-xl"
                          chainSlug={currentChain.slug}
                        />
                      )}
                    </>
                  ) : null}
                </div>
                <div className="text-white/50 text-xs italic">
                  Collateral value: {dollars({ value: offer?.totalCollateralValue ?? 0 })}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div>To Borrow</div>

                <>
                  {principle && borrowingToken ? (
                    <>
                      {editing ? (
                        <div className="flex items-center gap-2 animate-enter-div">
                          <input
                            min={0}
                            type="number"
                            max={offer?.isNFT[0] ? 1 : 10000000000000}
                            ref={newBorrowAmount}
                            className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                            placeholder={`new ${borrowingToken.symbol} amount`}
                            defaultValue={principle.amount}
                          />
                          {borrowingToken.symbol}
                        </div>
                      ) : (
                        <div className="-ml-[4px]">
                          <DisplayToken
                            size={32}
                            token={borrowingToken}
                            amount={principle.amount}
                            className="text-xl"
                            chainSlug={currentChain.slug}
                          />
                        </div>
                      )}
                    </>
                  ) : null}
                </>

                <div className="text-white/50 text-xs italic">
                  Borrow value: {dollars({ value: principle?.valueUsd ?? 0 })}
                </div>
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Payments Am.</div>
                {editing ? (
                  <div className="flex items-center gap-2 animate-enter-div">
                    <input
                      min={0}
                      type="number"
                      ref={newPaymentCount}
                      className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                      placeholder={`new amount`}
                      defaultValue={Number(offer?.paymentCount ?? 0)}
                    />
                  </div>
                ) : (
                  <div className="text-base">{Number(offer?.paymentCount ?? 0)}</div>
                )}
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                {editing ? (
                  <div className="flex items-center gap-2 animate-enter-div">
                    <input
                      min={0}
                      type="number"
                      ref={newTimelap}
                      className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                      placeholder={`new timelap`}
                      defaultValue={Number(offer?.numberOfLoanDays ?? 0)}
                    />
                  </div>
                ) : (
                  <div className="text-base">
                    {Number(offer?.numberOfLoanDays ?? 0)} {pluralize("day", Number(offer?.numberOfLoanDays ?? 0))}
                  </div>
                )}
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Perpetual</div>
                <div className="text-base">{yesNo(offer?.perpetual)}</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Interest</div>
                {editing ? (
                  <div className="flex items-center gap-2 animate-enter-div">
                    <input
                      min={0}
                      type="number"
                      ref={newInterest}
                      className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                      placeholder={`new interest`}
                      defaultValue={Number((offer?.interest ?? 0) * 100)}
                    />
                  </div>
                ) : (
                  <div className="text-base">
                    {thresholdLow(totalInterestOnLoan, 0.01, "< 0.01")} {borrowingToken?.symbol} (
                    {percent({ value: offer?.interest ?? 0 })})
                  </div>
                )}
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Each Payment Am.</div>
                <div className="text-base">
                  {offer?.isNFT[0] ? (
                    <>
                      {(offer?.interestData_NFT.amount / offer?.paymentCount).toFixed(2)}{" "}
                      {offer.interestData_NFT?.token?.symbol}
                    </>
                  ) : (
                    <>
                      {amountDuePerPayment.toFixed(2)} {borrowingToken?.symbol}
                    </>
                  )}
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
                      Accept Offer
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
                      <input
                        className="text-center rounded-lg text-sm px-4 py-2 bg-[#21232B]/40 border-2 border-white/10"
                        placeholder={`Amount of ${offer?.principle.token?.symbol}`}
                        type="number"
                        onChange={(e) => {
                          setAmountToBorrow(Number(e.currentTarget.value))
                        }}
                      />
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

              <ShowWhenFalse when={lendMachineState.matches("isNotOwner")}>
                {editing ? (
                  <Button
                    variant="action"
                    className="h-full w-full"
                    onClick={() => {
                      editOffer()
                    }}
                  >
                    Confirm
                  </Button>
                ) : (
                  ""
                )}
              </ShowWhenFalse>
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
