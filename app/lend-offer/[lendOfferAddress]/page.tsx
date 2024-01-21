"use client"

import createdOfferABI from "@/abis/v2/createdOffer.json"
import { PriceIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenFalse, ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayNftToken from "@/components/ux/display-nft-token"
import DisplayToken from "@/components/ux/display-token"
import RedirectToDashboardShortly from "@/components/ux/redirect-to-dashboard-shortly"
import SelectVeToken from "@/components/ux/select-ve-token"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import useNftInfo, { UserNftInfo } from "@/hooks/useNftInfo"
import { useOffer } from "@/hooks/useOffer"
import { dollars, ltv, percent, thresholdLow, yesNo } from "@/lib/display"
import { balanceOf, toDecimals } from "@/lib/erc20"
import { prettifyRpcError } from "@/lib/prettify-rpc-errors"
import { Token, isNft, nftUnderlying } from "@/lib/tokens"
import { cn, fixedDecimals } from "@/lib/utils"
import { DISCORD_INVITE_URL, ZERO_ADDRESS } from "@/services/constants"
import { useMachine } from "@xstate/react"
import dayjs from "dayjs"
import { CheckCircle, ExternalLink, Info, XCircle } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import pluralize from "pluralize"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Address, useConfig, useContractRead } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import erc20Abi from "../../../abis/erc20.json"
import NotOwnerInfo from "./components/not-owner-info"
import OwnerCancelButtons from "./components/owner-cancel-buttons"
import { machine } from "./lend-offer-machine"
import { createBrowserInspector } from "@statelyai/inspect"
import LendOfferStats from "./components/stats"
import NotOwnerErc20Buttons from "./components/not-owner-erc20-buttons"
import NotOwnerNftButtons from "./components/not-owner-nft-buttons"

const LoanChart = dynamic(() => import("@/components/charts/loan-chart"), { ssr: false })
const ChartWrapper = dynamic(() => import("@/components/charts/chart-wrapper"), { ssr: false })

const { inspect } = createBrowserInspector()

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

export default function LendOffer({ params }: { params: { lendOfferAddress: Address } }) {
  const config = useConfig()
  const { toast } = useToast()
  const [amountToBorrow, setAmountToBorrow] = useState(0)
  const [amountCollateral, setAmountCollateral] = useState(0)

  const newCollateralAmountRef = useRef<HTMLInputElement>(null)
  const newBorrowAmountRef = useRef<HTMLInputElement>(null)
  const newPaymentCountRef = useRef<HTMLInputElement>(null)
  const newTimelapRef = useRef<HTMLInputElement>(null)
  const newInterestRef = useRef<HTMLInputElement>(null)

  // for now we will set values into state, this might go into a machine soon, let's see
  const [newCollateralAmount, setNewCollateralAmount] = useState(0)
  const [newBorrowAmount, setNewBorrowAmount] = useState(0)
  const [newPaymentCount, setNewPaymentCount] = useState(0)
  const [newTimelap, setNewTimelap] = useState(0)
  const [newInterest, setNewInterest] = useState(0)
  const [selectedUserNft, setSelectedUserNft] = useState<UserNftInfo | undefined>(undefined)

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const lendOfferAddress = params.lendOfferAddress
  const OFFER_CREATED_ADDRESS = lendOfferAddress
  const { data: offer } = useOffer(address, lendOfferAddress)

  const principle = offer?.principle
  const collateral = offer?.collateral
  const collateralToken = collateral ? collateral?.token : undefined
  const principleToken = principle ? principle?.token : undefined
  const isOwnerConnected = address === offer?.owner

  const borrowingPrices = useHistoricalTokenPrices(currentChain.slug, offer?.principleAddressChart as Address)
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, offer?.collateralAddressChart as Address)
  const timestamps = borrowingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  // Nft info
  const principleNftInfos = useNftInfo({ address: lendOfferAddress as Address, token: principleToken })
  const addressNftInfos = useNftInfo({ address, token: collateralToken })
  const nftInfo = principleNftInfos?.[0]

  // console.log("nftInfo", nftInfo)
  // console.log("offer", offer)

  const onSelectCollateralUserNft = useCallback((userNft: UserNftInfo | null) => {
    if (userNft) {
      setSelectedUserNft(userNft)
    }
  }, [])

  // check if the viewer/user/borrower has the allowance to spend the collateral token
  const { data: currentCollateralTokenAllowance } = useContractRead({
    address: (collateral?.address ?? "") as Address,
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, OFFER_CREATED_ADDRESS],
  })

  // check if the owner has the allowance to spend the principle token when the offer is updated
  const { data: currentPrincipleTokenAllowance } = useContractRead({
    address: (principle?.address ?? "") as Address,
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, OFFER_CREATED_ADDRESS],
    // watch: true,
  })

  const handleWantedBorrow = (newValue: number) => {
    const amountCollateral = collateral && principle ? (collateral?.amount * newValue) / principle?.amount : 0
    setAmountToBorrow(newValue)
    setAmountCollateral(amountCollateral)
  }

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
    const transaction = await config.publicClient.waitForTransactionReceipt(executed)
    console.log("transaction", transaction)
  }

  const updateOffer = async () => {
    try {
      const newBorrow = principleToken ? Number(newBorrowAmount) * 10 ** principleToken?.decimals : 0
      const newCollateral = collateralToken ? Number(newCollateralAmount) * 10 ** collateralToken?.decimals : 0

      const { request } = await config.publicClient.simulateContract({
        address: OFFER_CREATED_ADDRESS,
        functionName: "editOffer",
        abi: createdOfferABI,
        args: [
          [newBorrow, newCollateral],
          [Number(newInterest) * 100, Number(newPaymentCount), Number(newTimelap) * 86400],
          0,
          0,
        ],
        account: address, // gas: BigInt(900000),
        // chainId: currentChain?.chainId,
      })

      const executed = await writeContract(request)
      console.log(executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

      toast({
        variant: "success",
        title: "Offer Updated",
        description: "You have updated the offer.",
        // tx: executed,
      })

      /* args: [[newAmountLending, newAmountCollateral], [newInterest,
        newPaymentCount, newTimelap], newVeValue, _newInterestRateForNFT], */
    } catch (error) {
      console.log("updateOffer→error", error)
      toast({
        variant: "error",
        title: "Error Updating Offer",
        description: prettifyRpcError({ error, nativeTokenSymbol: currentChain?.symbol }),
        // tx: executed,
      })
      throw error
    }
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
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

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

  /**
   * This action increases the collateral allowance, it is used by the user/borrower who will deposit the collateral to begin the loan
   * @returns
   */
  const increaseCollateralAllowance = async () => {
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
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

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

  const checkPrincipleAllowance = async () => {
    try {
      if (principle?.address === ZERO_ADDRESS) {
        return Promise.reject()
      }

      if (currentPrincipleTokenAllowance === undefined) {
        return Promise.resolve()
      }

      const borrowAmountRaw = Number(newBorrowAmount) * 10 ** (principleToken?.decimals ?? 18)

      if (Number(currentPrincipleTokenAllowance) >= Number(borrowAmountRaw ?? 0)) {
        return Promise.resolve()
      }

      return Promise.reject()
    } catch (error: any) {
      console.log("checkPrincipleAllowance", error)
      throw error
    }
  }

  const increasePrincipleAllowance = async () => {
    try {
      if (principle?.address === ZERO_ADDRESS) {
        return Promise.reject("Unknown principle token")
      }

      console.log("increasePrincipleAllowance")
      console.log("principle?.address", collateral?.address)

      const borrowAmountRaw = Number(newBorrowAmount) * 10 ** (principleToken?.decimals ?? 18)

      console.log("newBorrowAmount", newBorrowAmount)
      console.log("borrowAmountRaw", borrowAmountRaw)

      const { request } = await config.publicClient.simulateContract({
        address: (principle?.address ?? "") as Address,
        functionName: "approve",
        abi: erc20Abi,
        args: [OFFER_CREATED_ADDRESS, BigInt(borrowAmountRaw ?? 0)],
        account: address,
      })
      // console.log("increaseAllowance→request", request)

      const executed = await writeContract(request)
      console.log("increasePrincipleAllowance→executed", executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

      toast({
        variant: "success",
        title: "Allowance Increased",
        description: "You have increased the allowance and can now update the offer.",
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
      console.log("increasePrincipleAllowance→error", error)
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
        args: [toDecimals(amountToBorrow, principle?.token?.decimals ?? 0), 0],
        account: address,

        // chainId: currentChain?.chainId,
      })
      // console.log("userAcceptOffer→request", request)

      const executed = await writeContract(request)
      console.log("userAcceptOffer→executed", executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

      toast({
        variant: "success",
        title: "Offer Accepted",
        description: `You have accepted the offer, the borrowed ${principleToken?.symbol} is now in your wallet.`,
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
  const [state, send] = useMachine(
    machine.provide({
      actors: {
        acceptOffer: fromPromise(userAcceptOffer),
        cancelOffer: fromPromise(cancelOffer),
        increaseCollateralAllowance: fromPromise(increaseCollateralAllowance),
        checkPrincipleAllowance: fromPromise(checkPrincipleAllowance),
        increasePrincipleAllowance: fromPromise(increasePrincipleAllowance),
        updateOffer: fromPromise(updateOffer),
      },
    }),
    { inspect }
  )

  console.log("state.value", state.value)

  const shouldShowEditOfferForm =
    state.matches("isOwner.editing") ||
    state.matches("isOwner.checkPrincipleAllowance") ||
    state.matches("isOwner.increasePrincipleAllowance") ||
    state.matches("isOwner.errorIncreasingPrincipleAllowance") ||
    state.matches("isOwner.updateOffer") ||
    state.matches("isOwner.updatingOffer") ||
    state.matches("isOwner.errorUpdatingOffer")

  const canAlterEditUpdateForm =
    state.matches("isOwner.editing") || state.matches("isOwner.errorIncreasingPrincipleAllowance")

  // STATE MACHINE CONTROL
  // Connect the machine to the current on-chain state
  useEffect(() => {
    // if the user is not the owner
    if (isOwnerConnected && state.matches("isNotOwner")) {
      send({ type: "owner" })
    }

    if (!isOwnerConnected) {
      send({ type: "not.owner" })

      // dual collateral mode
      if (collateral) {
        // Is the user providing an nft or ERC20 token?
        if (isNft(collateralToken)) {
          send({ type: "is.nft" })
        } else {
          send({ type: "is.erc20" })
        }

        // do they have the required allowance to pay for the offer?
        if (currentCollateralTokenAllowance === undefined) {
          return
        }
        if (Number(currentCollateralTokenAllowance) >= Number(collateral?.amountRaw ?? 0)) {
          send({ type: "user.has.allowance" })
          return
        }
        if (!state.matches("isNotOwner.notEnoughAllowance")) {
          send({ type: "user.not.has.allowance" })
          return
        }
      }

      // single collateral mode
      if (collateral) {
        // do they have the required allowance to pay for the offer?
        if (currentCollateralTokenAllowance === undefined) {
          return
        }
        if (Number(currentCollateralTokenAllowance) >= Number(collateral?.amountRaw ?? 0)) {
          send({ type: "user.has.allowance" })
          return
        }
        if (!state.matches("isNotOwner.notEnoughAllowance")) {
          send({ type: "user.not.has.allowance" })
        }
      }
    }
  }, [isOwnerConnected, currentCollateralTokenAllowance, state, send, collateral])

  // initialise the state values whenever we enter the isOwner.editing state
  useEffect(() => {
    if (state.matches("isOwner.editing")) {
      setNewCollateralAmount(collateral?.amount ?? 0)
      setNewBorrowAmount(principle?.amount ?? 0)
      setNewPaymentCount(offer?.paymentCount ?? 0)
      setNewTimelap(offer?.numberOfLoanDays ?? 0)
      setNewInterest(offer?.interest ?? 0)
    }
  }, [collateral?.amount, offer?.interest, offer?.numberOfLoanDays, offer?.paymentCount, principle?.amount, state])

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    const result = [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
    if (principleToken) {
      result.push(
        <Link href={`/borrow/`} className="hover:text-white/75" key="lending-market">
          Borrow Market
        </Link>
      )
      result.push(
        <Link href={`/borrow/${principleToken?.address}`} key="token">
          <DisplayToken
            size={18}
            token={principleToken}
            className="hover:text-white/75"
            chainSlug={currentChain.slug}
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
    historicalLender: calcPriceHistory(borrowingPrices, offer?.principleAmountChart ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      offer?.collateralAmountChart ?? 0,
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
          Lend Offer
        </h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16 animate-enter-div">
        <div className="flex flex-col gap-8">
          <LendOfferStats
            ltvValue={Number(offer?.ltv)}
            totalCollateralValue={Number(offer?.totalCollateralValue)}
            borrowingValue={Number(principle?.valueUsd)}
          />
          <div>
            <ChartWrapper>
              <LoanChart loanData={chartValues} />
            </ChartWrapper>
          </div>
        </div>
        <div className="space-y-8 max-w-xl w-full xl:ml-16">
          {/* Owners can cancel the offer */}
          <OwnerCancelButtons state={state} send={send} />

          {/* Non owners can see who the owner is */}
          <NotOwnerInfo state={state} borrowingToken={principleToken} ownerAddress={offer?.owner as Address} />

          {/* Form Panel */}
          <div className="bg-[#32282D]/40 border border-[#743A49] p-8 rounded-xl shadow-xl shadow-[#392A31]/60">
            <div className="text-xl mb-4 font-bold flex items-center gap-5">
              <ShowWhenTrue when={state.matches("isOwner")}>
                <div
                  onClick={async () => {
                    state.matches("isOwner.editing") ? send({ type: "owner.cancel" }) : send({ type: "owner.editing" })
                  }}
                  className="bg-debitaPink/10 px-4 text-sm py-2 rounded-xl cursor-pointer text-gray-300"
                >
                  <div>{state.matches("isOwner.editing") ? "Cancel" : "Edit Offer"}</div>
                </div>
              </ShowWhenTrue>
              <ShowWhenTrue when={state.matches("isOwner")}>
                <label className="relative inline-flex items-center cursor-pointer ml-auto">
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
              </ShowWhenTrue>
            </div>
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className={cn("flex flex-col gap-3", state.matches("isOwner") ? "order-last" : null)}>
                {state.matches("isOwner") ? <div>User Provides Collateral</div> : <div>You Provide Collateral</div>}
                <div className="-ml-[px] grow">
                  {collateral && collateralToken ? (
                    <>
                      {!isNft(collateralToken) && shouldShowEditOfferForm ? (
                        <div className="flex items-center gap-2 animate-enter-div">
                          <input
                            min={0}
                            max={10000000000000}
                            type="number"
                            ref={newCollateralAmountRef}
                            className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                            placeholder={`new ${collateralToken.symbol} amount`}
                            defaultValue={collateral.amount}
                            onChange={(e) => {
                              setNewCollateralAmount(Number(e.target.value))
                            }}
                            disabled={!canAlterEditUpdateForm}
                          />
                          {collateralToken.symbol}
                        </div>
                      ) : (
                        <div className="-ml-[4px] grow">
                          <ShowWhenTrue when={!isNft(collateralToken)}>
                            <DisplayToken
                              size={32}
                              token={collateralToken}
                              amount={collateral.amount}
                              className="text-xl"
                              chainSlug={currentChain.slug}
                            />
                          </ShowWhenTrue>
                          <ShowWhenTrue when={isNft(collateralToken)}>
                            <DisplayNftToken
                              size={32}
                              token={collateralToken}
                              amount={collateral.amount}
                              className="text-xl"
                              chainSlug={currentChain.slug}
                              nftInfo={nftInfo}
                              showExtendedUnderlying={true}
                              wantedLockedEqual={offer?.wantedLockedVeNFT}
                            />
                          </ShowWhenTrue>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
                <ShowWhenTrue when={nftUnderlying(collateralToken) == undefined}>
                  <div className="text-white/50 text-xs italic">
                    Collateral value: {dollars({ value: offer?.totalCollateralValue ?? 0 })}
                  </div>
                </ShowWhenTrue>
              </div>
              <div className="flex flex-col gap-3">
                {state.matches("isOwner") ? <div>You are Lending</div> : <div>To Borrow</div>}

                <>
                  {principle && principleToken ? (
                    <>
                      {!isNft(principleToken) && shouldShowEditOfferForm ? (
                        <div className="flex items-center gap-2 animate-enter-div">
                          <input
                            min={0}
                            type="number"
                            max={isNft(offer?.collateral?.token) ? 1 : 10000000000000}
                            ref={newBorrowAmountRef}
                            className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                            placeholder={`new ${principleToken.symbol} amount`}
                            defaultValue={principle.amount}
                            onChange={(e) => {
                              setNewBorrowAmount(Number(e.target.value))
                            }}
                            disabled={!canAlterEditUpdateForm}
                          />
                          {principleToken.symbol}
                        </div>
                      ) : (
                        <div className="-ml-[4px] grow">
                          <ShowWhenTrue when={!isNft(principleToken)}>
                            <DisplayToken
                              size={32}
                              token={principleToken}
                              amount={principle.amount}
                              className="text-xl"
                              chainSlug={currentChain.slug}
                            />
                          </ShowWhenTrue>
                          <ShowWhenTrue when={isNft(principleToken)}>
                            <DisplayNftToken
                              size={32}
                              token={principleToken}
                              amount={principle.amount}
                              className="text-xl"
                              chainSlug={currentChain.slug}
                              nftInfo={nftInfo}
                              showExtendedUnderlying={true}
                            />
                          </ShowWhenTrue>
                        </div>
                      )}
                    </>
                  ) : null}
                </>
                <ShowWhenTrue when={!isNft(principleToken)}>
                  <div className="text-white/50 text-xs italic">
                    Borrow value: {dollars({ value: principle?.valueUsd ?? 0 })}
                  </div>
                </ShowWhenTrue>
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Payments Am.</div>
                <ShowWhenTrue when={shouldShowEditOfferForm}>
                  <div className="flex items-center gap-2 animate-enter-div mt-1">
                    <input
                      min={0}
                      type="number"
                      ref={newPaymentCountRef}
                      className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                      placeholder={`new amount`}
                      defaultValue={Number(offer?.paymentCount ?? 0)}
                      onChange={(e) => {
                        setNewPaymentCount(Number(e.target.value))
                      }}
                      disabled={!canAlterEditUpdateForm}
                    />
                  </div>
                </ShowWhenTrue>
                <ShowWhenFalse when={shouldShowEditOfferForm}>
                  <div className="text-base">{Number(offer?.paymentCount ?? 0)}</div>
                </ShowWhenFalse>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <ShowWhenTrue when={shouldShowEditOfferForm}>
                  <div className="flex items-center gap-2 animate-enter-div mt-1">
                    <input
                      min={0}
                      type="number"
                      ref={newTimelapRef}
                      className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                      placeholder={`new timelap`}
                      defaultValue={Number(offer?.numberOfLoanDays ?? 0)}
                      onChange={(e) => {
                        setNewTimelap(Number(e.target.value))
                      }}
                      disabled={!canAlterEditUpdateForm}
                    />
                  </div>
                </ShowWhenTrue>
                <ShowWhenFalse when={shouldShowEditOfferForm}>
                  <div className="text-base">
                    {Number(offer?.numberOfLoanDays ?? 0)} {pluralize("day", Number(offer?.numberOfLoanDays ?? 0))}
                  </div>
                </ShowWhenFalse>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2 flex flex-col justify-between">
                <div className="text-[#DCB5BC]">Perpetual</div>
                <div className={cn("text-base")}>{yesNo(offer?.perpetual)}</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Interest</div>
                <ShowWhenTrue when={shouldShowEditOfferForm}>
                  <div className="flex items-center gap-2 animate-enter-div mt-1">
                    <input
                      min={0}
                      type="number"
                      ref={newInterestRef}
                      className="px-3 py-1.5 w-1/2 text-sm rounded-lg bg-debitaPink/20 text-white"
                      placeholder={`new interest`}
                      defaultValue={Number(offer?.interest ?? 0) * 100}
                      onChange={(e) => {
                        setNewInterest(Number(e.target.value))
                      }}
                      disabled={!canAlterEditUpdateForm}
                    />
                  </div>
                </ShowWhenTrue>
                <ShowWhenFalse when={shouldShowEditOfferForm}>
                  <div className="text-base">
                    {thresholdLow(totalInterestOnLoan, 0.01, "< 0.01")} {principleToken?.symbol} (
                    {percent({ value: Number(offer?.interest ?? 0) })})
                  </div>
                </ShowWhenFalse>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2 flex flex-col justify-between">
                <div className="text-[#DCB5BC]">Each Payment Am.</div>
                <div className="text-base">
                  {isNft(offer?.collateral?.token) ? (
                    <>
                      {(offer?.nftInterestToken?.amount / offer?.paymentCount).toFixed(2)}{" "}
                      {offer.nftInterestToken?.token?.symbol}
                    </>
                  ) : (
                    <>
                      {amountDuePerPayment.toFixed(2)} {principleToken?.symbol}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex justify-center">
              <ShowWhenTrue when={state.matches("isNotOwner.erc20")}>
                <NotOwnerErc20Buttons
                  state={state}
                  send={send}
                  handleWantedBorrow={handleWantedBorrow}
                  collateralToken={collateralToken}
                  principle={principle}
                  amountCollateral={amountCollateral}
                />
              </ShowWhenTrue>

              <ShowWhenTrue when={state.matches("isNotOwner.nft")}>
                <NotOwnerNftButtons state={state} send={send} />
              </ShowWhenTrue>

              {/* <ShowWhenTrue when={isNft(collateralToken)}>
                  <SelectVeToken
                    token={collateralToken}
                    selectedUserNft={selectedUserNft}
                    onSelectUserNft={onSelectCollateralUserNft}
                    userNftInfo={addressNftInfos}
                  />
                  NotOwnerNftButtons
                </ShowWhenTrue> */}

              <ShowWhenTrue when={shouldShowEditOfferForm}>
                <ShowWhenTrue when={state.matches("isOwner.editing")}>
                  <Button
                    variant="action"
                    className="h-full w-1/2"
                    onClick={() => {
                      send({ type: "owner.update.offer" })
                    }}
                  >
                    Update Offer
                  </Button>
                </ShowWhenTrue>
                <ShowWhenTrue when={state.matches("isOwner.checkPrincipleAllowance")}>
                  <Button variant="action" className="h-full w-1/2">
                    Update Offer
                  </Button>
                </ShowWhenTrue>
                <ShowWhenTrue when={state.matches("isOwner.increasePrincipleAllowance")}>
                  <div className="flex justify-between w-full">
                    <Button
                      variant="ghost"
                      className=""
                      onClick={() => {
                        send({ type: "cancel" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="action" className="h-full w-1/2">
                      Increase Allowance
                      <SpinnerIcon className="ml-2 animate-spin-slow" />
                    </Button>
                  </div>
                </ShowWhenTrue>
                <ShowWhenTrue when={state.matches("isOwner.errorIncreasingPrincipleAllowance")}>
                  <div className="flex justify-between w-full">
                    <Button
                      variant="ghost"
                      className=""
                      onClick={() => {
                        send({ type: "cancel" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="error"
                      className="px-12 gap-2"
                      onClick={() => {
                        send({ type: "owner.increase.principle.allowance.retry" })
                      }}
                    >
                      <XCircle className="h-5 w-5" />
                      Increase Allowance Failed - Retry?
                    </Button>
                  </div>
                </ShowWhenTrue>
                <ShowWhenTrue when={state.matches("isOwner.updatingOffer")}>
                  <div className="flex justify-between w-full">
                    <Button
                      variant="ghost"
                      className=""
                      onClick={() => {
                        send({ type: "cancel" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="action" className="h-full px-8">
                      Updating Offer
                      <SpinnerIcon className="ml-2 animate-spin-slow" />
                    </Button>
                  </div>
                </ShowWhenTrue>
              </ShowWhenTrue>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * This panel will generate the borrow offer description from the passed collateral data
 *
 * The text is hard coded for now just to show what It could look like
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
