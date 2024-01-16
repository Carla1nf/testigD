"use client"

import veTokenAbi from "@/abis/v2/veToken.json"
import { DebitaIcon, SpinnerIcon } from "@/components/icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenFalse, ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import SelectToken from "@/components/ux/select-token"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useNftInfo, { UserNftInfo } from "@/hooks/useNftInfo"
import { DEBITA_OFFER_FACTORY_ADDRESS } from "@/lib/contracts"
import { dollars, percent } from "@/lib/display"
import { toDecimals } from "@/lib/erc20"
import { Token, findInternalTokenBySymbol, getAllTokens } from "@/lib/tokens"
import { cn, fixedDecimals } from "@/lib/utils"
import { ZERO_ADDRESS } from "@/services/constants"
import { createBrowserInspector } from "@statelyai/inspect"
import { useMachine } from "@xstate/react"
import { AlertCircle, LucideMinus, LucidePlus, XCircle } from "lucide-react"
import Link from "next/link"
import pluralize from "pluralize"
import { InputNumber } from "primereact/inputnumber"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Address, decodeEventLog, parseAbi } from "viem"
import { PublicClient, useConfig } from "wagmi"
import { readContract, writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import erc20Abi from "../../abis/erc20.json"
import offerFactoryABI from "../../abis/v2/debitaOfferFactoryV2.json"
import { LendingMode, machine } from "./create-offer-machine"

// function convertBigIntToString(obj: any): any {
//   if (obj === null || obj === undefined) {
//     return obj
//   }

//   // Handling arrays
//   if (Array.isArray(obj)) {
//     return obj.map(convertBigIntToString)
//   }

//   // Handling objects
//   if (typeof obj === "object") {
//     const result: { [key: string]: any } = {}
//     for (const [key, value] of Object.entries(obj)) {
//       result[key] = convertBigIntToString(value)
//     }
//     return result
//   }

//   // Converting bigint to string
//   if (typeof obj === "bigint") {
//     return obj.toString()
//   }

//   // Returning all other types as they are
//   return obj
// }

// const { inspect } = createBrowserInspector({
//   serialize: (event) => {
//     const processed = convertBigIntToString(event)

//     return processed
//   },
// })

const { inspect } = createBrowserInspector()
const displayEstimatedApr = (estimatedApr: number) => {
  return percent({
    value: estimatedApr ?? 0,
    decimalsWhenGteOne: 2,
    decimalsWhenLessThanOne: 2,
  })
}

// begin a little library of reusable web3 functions
const isVeTokenApprovedOrOwner = async ({
  veToken,
  spender,
  nftId,
}: {
  veToken: Address
  spender: Address
  nftId: bigint
}) => {
  const hasPermissions = await readContract({
    address: veToken,
    functionName: "isApprovedOrOwner",
    abi: veTokenAbi,
    args: [spender, nftId],
  })
  return Boolean(hasPermissions)
}

const approveVeToken = async ({
  veToken,
  spender,
  account,
  nftId,
  publicClient,
}: {
  veToken: Address
  spender: Address
  account: Address
  nftId: bigint
  publicClient: PublicClient
}) => {
  const { request } = await publicClient.simulateContract({
    address: veToken,
    functionName: "approve",
    abi: veTokenAbi,
    args: [spender, nftId],
    account,
  })

  console.log("")
  console.log("approveVeToken")
  console.log("veToken", veToken)
  console.log("[spender, nftId]", [spender, nftId])
  const executed = await writeContract(request)
  console.log("executed", executed)
  const transaction = await publicClient.waitForTransactionReceipt(executed)
  console.log("transaction", transaction)
  console.log("")

  return Promise.resolve(executed)
}

export default function Create() {
  const config = useConfig()
  const { address } = useControlledAddress()
  const currentChain = useCurrentChain()
  const wftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "wFTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])
  const [offerAddress, setAddress] = useState("")

  // CREATE BORROW MACHINE

  const setOfferAddress = async (tx: any) => {
    let decoded = {}
    console.log("decoding..")
    try {
      decoded = decodeEventLog({
        abi: parseAbi(["event CreateOffer(address indexed owner, address indexed _add, bool indexed senderIsLender)"]),
        data: tx?.logs[2].data,
        topics: tx?.logs[2].topics,
      })
      setAddress(decoded?.args._add)
      console.log("withdrawFromVault->decoded", decoded)
    } catch (error) {
      console.log("withdrawFromVault->decode error", error)
    }
  }

  const checkBorrowingAllowance = async ({ input: { context } }) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance

    // collateralAmount of collateralToken
    if (context.collateralToken.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    const amountRequired = toDecimals(context.collateralAmount, context.collateralToken.decimals)

    const currentAllowance = (await readContract({
      address: context.collateralToken.address,
      functionName: "allowance",
      abi: erc20Abi,
      args: [address, DEBITA_OFFER_FACTORY_ADDRESS],
    })) as bigint

    if (BigInt(currentAllowance) >= amountRequired) {
      return Promise.resolve({ currentAllowance, amountRequired })
    }

    throw "not enough allowance"
  }

  const approveBorrowAllowance = async ({ input: { context } }) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance

    // collateralAmount of collateralToken
    if (context.collateralToken.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    const amountRequired = toDecimals(context.collateralAmount, context.collateralToken.decimals)

    const { request } = await config.publicClient.simulateContract({
      address: context.collateralToken.address,
      functionName: "approve",
      abi: erc20Abi,
      args: [DEBITA_OFFER_FACTORY_ADDRESS, amountRequired],
      account: address,
    })

    const executed = await writeContract(request)
    // console.log("approveBorrowAllowance", executed)
    const transaction = await config.publicClient.waitForTransactionReceipt(executed)
    console.log("transaction", transaction)

    return executed
  }

  const creatingOffer = async ({ input }) => {
    console.log("creatingOffer")
    console.log("input", input)
    const { context, event } = input

    console.log("context", context)
    console.log("event", event)

    //  value used in both modes
    const _interest = context.interestPercent * 100
    const _timelap = (86400 * context.durationDays) / context.numberOfPayments
    const _paymentCount = context.numberOfPayments

    try {
      const collateralAmount = toDecimals(context.collateralAmount, context.collateralToken.decimals)

      const lenderAddress = context.token.address
      const collateralAddress = context.collateralToken.address
      const lenderAmount = toDecimals(context.tokenAmount, context.token.decimals)

      // NFT info (if applicable)
      const isCollateralAssetNFT = Boolean(context?.collateralToken?.nft?.isNft ?? false)
      const isTokenAssetNFT = Boolean(context?.token?.nft?.isNft ?? false)
      const collateralTokenNftId =
        isCollateralAssetNFT && context?.collateralUserNft?.id ? context?.collateralUserNft?.id : 0
      const tokenNftId = isTokenAssetNFT && context?.tokenUserNft?.id ? context?.tokenUserNft?.id : 0

      // calculate value

      // calculate amount args
      const amountArgs = [isTokenAssetNFT ? 1 : lenderAmount, isCollateralAssetNFT ? 1 : collateralAmount]

      const nftArgs = [isLendingMode ? tokenNftId : collateralTokenNftId, 1]
      console.log("nftArgs", nftArgs)

      const { request } = await config.publicClient.simulateContract({
        address: DEBITA_OFFER_FACTORY_ADDRESS,
        functionName: "createOfferV2",
        abi: offerFactoryABI,
        args: [
          [lenderAddress, collateralAddress],
          amountArgs,
          [isTokenAssetNFT, isCollateralAssetNFT /*  if assets are NFTs --> false for now*/],
          _interest,
          nftArgs, // [collateralTokenNftId, 1 /*  NFT id & Interest rate for nfts --> 0 for now*/],
          100 /*  value of wanted veNFTs --> 0 for now*/,
          _paymentCount,
          _timelap,
          [isLendingMode, true], // [0] --> isLending, [1] --> isPerpetual
          "0x3Fd3A0c85B70754eFc07aC9Ac0cbBDCe664865A6", // 0x0 for now --> address of the erc-20 token that will be used to pay the interest in case is lending an NFT
        ],
        account: address,
        gas: BigInt(4000000),
      })

      const executed = await writeContract(request)
      console.log("createLenderOption", executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)
      setOfferAddress(transaction)
    } catch (error: any) {
      console.log("createLenderOption->error", error)

      return Promise.reject({ error: error.message })
    }
  }

  const checkingLendAllowance = async ({ input: { context } }) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance

    // collateralAmount of collateralToken
    if (context.token.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    if (context.token.nft?.isNft) {
      const hasPermissions = await isVeTokenApprovedOrOwner({
        veToken: context.token.address,
        spender: DEBITA_OFFER_FACTORY_ADDRESS,
        nftId: context.tokenUserNft.id,
      })

      if (hasPermissions) {
        return Promise.resolve({ hasPermissions })
      }

      throw "needs permission"
    } else {
      const amountRequired = toDecimals(context.tokenAmount, context.token.decimals)
      const currentAllowance = (await readContract({
        address: context.token.address,
        functionName: "allowance",
        abi: erc20Abi,
        args: [address, DEBITA_OFFER_FACTORY_ADDRESS],
      })) as bigint

      if (BigInt(currentAllowance) >= amountRequired) {
        return Promise.resolve({ currentAllowance, amountRequired })
      }

      throw "not enough allowance"
    }

    // return allowance0
  }

  const approveLendAllowance = async ({ input: { context } }) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance

    // collateralAmount of collateralToken
    if (context.token.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    if (context.token.nft?.isNft) {
      console.log("NFT")
      console.log("approveLendAllowance")

      return approveVeToken({
        veToken: context.token.address,
        spender: DEBITA_OFFER_FACTORY_ADDRESS,
        account: address as Address,
        nftId: context.tokenUserNft.id,
        publicClient: config.publicClient,
      })
      // const { request } = await config.publicClient.simulateContract({
      //   address: context.token.address,
      //   functionName: "approve",
      //   abi: veTokenAbi,
      //   args: [DEBITA_OFFER_FACTORY_ADDRESS, context.tokenUserNft.id],
      //   account: address,
      // })

      // const executed = await writeContract(request)
      // // console.log("approveLendAllowance", executed)
      // const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      // console.log("transaction", transaction)

      // return Promise.resolve(executed)
    } else {
      const amountRequired = toDecimals(context.tokenAmount, context.token.decimals)

      const { request } = await config.publicClient.simulateContract({
        address: context.token.address,
        functionName: "approve",
        abi: erc20Abi,
        args: [DEBITA_OFFER_FACTORY_ADDRESS, amountRequired],
        account: address,
      })

      const executed = await writeContract(request)
      // console.log("approveLendAllowance", executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

      return Promise.resolve(executed)
    }
  }

  const [state, send] = useMachine(
    machine.provide({
      actors: {
        checkingBorrowAllowance: fromPromise(checkBorrowingAllowance),
        approveBorrowAllowance: fromPromise(approveBorrowAllowance),
        creatingOffer: fromPromise(creatingOffer),
        checkingLendAllowance: fromPromise(checkingLendAllowance),
        approveLendAllowance: fromPromise(approveLendAllowance),
      },
    }),
    {
      inspect,
    }
  )

  const mode = state.context.mode
  const isLendingMode = mode === ("lend" as LendingMode)
  const isBorrowingMode = mode === ("borrow" as LendingMode)

  const collateralNfts = useNftInfo({ address, token: state?.context?.collateralToken })
  const tokenNfts = useNftInfo({ address, token: state?.context?.token })
  const [ltvCustomInputValue, setLtvCustomInputValue] = useState("")
  const ltvCustomInputRef = useRef<HTMLInputElement>(null)

  // console.log("context", state.context)
  console.log("value", state.value)

  /**
   * The user can enter an LTV ratio manually, and have the field calculated when they alter the amount field.
   * This leads to circular logic so we need to detect which scenario is happening and react accordingly.
   *
   * If the machine has just recalculated ltvRatio and the input is not focused, update ltvCustomInputValue
   */
  useEffect(() => {
    if (
      ltvCustomInputRef &&
      ltvCustomInputRef.current &&
      state.context.ltvRatio !== parseFloat(ltvCustomInputValue) &&
      !ltvCustomInputRef.current.matches(":focus")
    ) {
      setLtvCustomInputValue(fixedDecimals(state?.context?.ltvRatio ?? 0, 3).toString())
    }
  }, [state.context.ltvRatio, ltvCustomInputValue])

  // Default tokens
  useEffect(() => {
    if (wftm && state.context.collateralToken === undefined) {
      send({ type: "collateralToken", value: wftm })
    }
    if (usdc && state.context.token === undefined) {
      send({ type: "token", value: usdc })
    }
  }, [wftm, usdc, state.context.collateralToken, send, state.context.token])

  // TOKENS
  const tokens = useMemo(() => {
    // refresh tokens when the chain changes
    const all = getAllTokens(currentChain.slug)
    all.sort((a, b) => {
      return a.symbol.localeCompare(b.symbol)
    })
    return all
  }, [currentChain.slug])

  // EVENT HANDLERS
  const onSelectCollateralToken0 = useCallback(
    (token: Token | null) => {
      if (token) {
        send({ type: "collateralToken", value: token })
      }
    },
    [send]
  )

  const onSelectCollateralAmount0 = useCallback(
    (value: number | undefined) => {
      send({ type: "collateralAmount", value })
    },
    [send]
  )

  const onSelectToken = useCallback(
    (token: Token | null) => {
      if (token) {
        send({ type: "token", value: token })
      }
    },
    [send]
  )

  // one for collateral another for token?
  const onSelectCollateralUserNft = useCallback(
    (userNft: UserNftInfo | null) => {
      if (userNft) {
        send({ type: "collateralUserNft", value: userNft })
      }
    },
    [send]
  )
  const onSelectTokenUserNft = useCallback(
    (userNft: UserNftInfo | null) => {
      if (userNft) {
        send({ type: "tokenUserNft", value: userNft })
      }
    },
    [send]
  )

  const onSelectTokenAmount = useCallback(
    (value: number | undefined) => {
      send({ type: "tokenAmount", value })
    },
    [send]
  )

  const back = useCallback(() => {
    send({ type: "back" })
  }, [send])

  // quick calcs - move to machine later
  const numberOfPayments = Number(state.context.numberOfPayments)
  const durationDays = Number(state.context.durationDays)
  const daysPerPayment = durationDays / numberOfPayments
  const loanAmount = Number(state.context.tokenAmount)
  const totalLoanInterest = loanAmount * (Number(state.context.interestPercent) / 100)
  const loanFee = totalLoanInterest * 0.06
  const actualInterest = totalLoanInterest - loanFee
  const interestPerDay = actualInterest / durationDays / 100

  const breadcrumbs = useMemo(() => {
    const result = [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]

    return result
  }, [currentChain])

  return (
    <div className="flex md:flex-row  flex-col gap-6">
      <div className="animate-enter-div">
        {/* Page header */}
        <div className="@container mb-8 space-y-4">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">Create Offer</h1>
        </div>

        {/* We can only switch modes when the filling out the form or confirming the offer */}
        <ShowWhenTrue when={state.matches("form")}>
          <Tabs
            defaultValue={mode}
            className=""
            onValueChange={(value) => {
              if (["lend", "borrow"].includes(value)) {
                send({ type: "mode", mode: value as "lend" | "borrow" })
              }
            }}
          >
            <TabsList className="bg-[#252324] rounded-b-none gap-2">
              <TabsTrigger value="lend" className="px-12">
                Lend
              </TabsTrigger>
              <TabsTrigger value="borrow" className="px-12">
                Borrow
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </ShowWhenTrue>

        {/* Form */}
        <ShowWhenTrue when={state.matches("form")}>
          <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
            <div className={cn("flex gap-6", isLendingMode ? "flex-col-reverse" : "flex-col")}>
              {/* Collateral token 0 */}
              <div className="">
                <div className="flex justify-between items-center">
                  <ShowWhenTrue when={isBorrowingMode}>
                    <Label variant="create">Your Collateral Token</Label>
                  </ShowWhenTrue>
                  <ShowWhenTrue when={isLendingMode}>
                    <Label variant="create">Wanted Collateral Token</Label>
                  </ShowWhenTrue>
                  <TokenValuation
                    token={state.context.collateralToken}
                    price={state.context.collateralPrice}
                    amount={Number(state.context.collateralAmount)}
                    value={state.context.collateralValue}
                    className="mb-2 italic"
                  />
                </div>
                <SelectToken
                  tokens={tokens}
                  amount={state.context.collateralAmount}
                  defaultToken={wftm as Token}
                  selectedToken={state.context.collateralToken}
                  selectedUserNft={state.context.collateralUserNft}
                  onSelectToken={onSelectCollateralToken0}
                  onAmountChange={onSelectCollateralAmount0}
                  userNftInfo={collateralNfts}
                  onSelectUserNft={onSelectCollateralUserNft}
                />
              </div>

              {/* Wanted borrow token */}
              <div className="">
                <div className="flex justify-between items-center">
                  <ShowWhenTrue when={isBorrowingMode}>
                    <Label variant="create">Wanted Borrow Token</Label>
                  </ShowWhenTrue>
                  <ShowWhenTrue when={isLendingMode}>
                    <Label variant="create">Your Lending Token</Label>
                  </ShowWhenTrue>
                  <TokenValuation
                    token={state.context.token}
                    price={state.context.tokenPrice}
                    amount={Number(state.context.tokenAmount)}
                    value={Number(state.context.tokenValue)}
                    className="mb-2 italic"
                  />
                </div>
                <SelectToken
                  tokens={tokens}
                  amount={state.context.tokenAmount}
                  selectedToken={state.context.token}
                  selectedUserNft={state.context.tokenUserNft}
                  defaultToken={usdc as Token}
                  onSelectToken={onSelectToken}
                  onAmountChange={onSelectTokenAmount}
                  userNftInfo={tokenNfts}
                  onSelectUserNft={onSelectTokenUserNft}
                />
              </div>
            </div>

            {/* LTV Ratio */}
            <div>
              <Label variant="create">LTV Ratio</Label>
              <div className="grid grid-cols-5 gap-4">
                <Button
                  variant={state.matches("form.ltvRatio.ltv25") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    send({ type: "forceLtvRatio", value: 0.25 })
                  }}
                >
                  25%
                </Button>
                <Button
                  variant={state.matches("form.ltvRatio.ltv50") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    send({ type: "forceLtvRatio", value: 0.5 })
                  }}
                >
                  50%
                </Button>
                <Button
                  variant={state.matches("form.ltvRatio.ltv75") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    send({ type: "forceLtvRatio", value: 0.75 })
                  }}
                >
                  75%
                </Button>
                <Button
                  variant={state.matches("form.ltvRatio.ltvcustom") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    if (ltvCustomInputRef && ltvCustomInputRef.current) {
                      ltvCustomInputRef.current.focus()
                    }
                  }}
                >
                  Custom
                </Button>
                <div>
                  <Input
                    ref={ltvCustomInputRef}
                    type="number"
                    variant={state.matches("form.ltvRatio.ltvcustom") ? "option" : "option-muted"}
                    className="text-center"
                    placeholder="0"
                    value={ltvCustomInputValue}
                    onFocus={() => {
                      send({ type: "ltv.custom" })
                    }}
                    onBlur={() => {
                      const value = parseFloat(ltvCustomInputValue || "0")
                      if (!Number.isNaN(value)) {
                        send({ type: "forceLtvRatio", value: value / 100 })
                      }
                    }}
                    onChange={(e) => {
                      const re = /^[0-9]*\.?[0-9]*$/
                      if (e.target.value === "" || re.test(e.target.value)) {
                        setLtvCustomInputValue(e.target.value)
                        const value = parseFloat(e.target.value || "0")
                        if (!Number.isNaN(value)) {
                          send({ type: "forceLtvRatio", value: value / 100 })
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 gap-y-8 my-4">
              <div className="flex flex-col gap-1">
                <Label variant="create">Interest on Loan (%)</Label>
                <NumberInput
                  min={0}
                  max={100000}
                  send={send}
                  event="interestPercent"
                  initialValue={state.context.interestPercent}
                  minFractionDigits={2}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label variant="create">Estimated APR (%)</Label>
                <div className="text-[#9F9F9F] text-lg font-bold">
                  {displayEstimatedApr(state.context.estimatedApr)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label variant="create">Loan Duration (days)</Label>
                <NumberInput
                  min={0}
                  max={365}
                  send={send}
                  event="durationDays"
                  initialValue={state.context.durationDays}
                  minFractionDigits={0}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label variant="create">Total Payments</Label>
                <NumberInput
                  min={0}
                  max={10}
                  send={send}
                  event="numberOfPayments"
                  initialValue={state.context.numberOfPayments}
                  minFractionDigits={0}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="action"
                className="px-12"
                disabled={!state.can({ type: "next" })}
                onClick={() => {
                  send({ type: "next" })
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </ShowWhenTrue>

        {/* I have changed my mind on this view

      My initial plan was to have different views per state but now I want to keep the confirmation values constantly visible to he user
      so they can back out at any time or make changes.

      We will use the `borrow` page pattern of changing the buttons per state instead of the whole form, it will
      feel a LOT more interactive and less jarring for the user.
      
      
      */}
        <ShowWhenTrue
          when={
            state.matches("confirmation") ||
            state.matches("checkingBorrowAllowance") ||
            state.matches("approveBorrowAllowance") ||
            state.matches("checkingLendAllowance") ||
            state.matches("approveLendAllowance") ||
            state.matches("creating") ||
            state.matches("created") ||
            state.matches("error")
          }
        >
          <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
            <div className="">
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-2 items-center">
                  <div className="text-xl font-bold">
                    <ShowWhenTrue when={isBorrowingMode}>Confirm Borrow Offer</ShowWhenTrue>
                    <ShowWhenTrue when={isLendingMode}>Confirm Lend Offer</ShowWhenTrue>
                  </div>
                </div>
                <DebitaIcon className="h-9 w-9 flex-basis-1" />
              </div>

              {/* <hr className="h-px mt-4 bg-[#4D4348] border-0" /> */}
            </div>

            <div className="grid grid-cols-2 gap-x-16 gap-y-4">
              <div className="border border-white/10 rounded-sm p-2 px-2 md:pr-32 col-span-2">
                <Label variant="create">Payments</Label>
                <div className="font-bold text-base text-[#D0D0D0]">
                  <ShowWhenTrue when={numberOfPayments === 1}>
                    There is a single payment due after {durationDays} {pluralize("day", durationDays)}.
                  </ShowWhenTrue>
                  <ShowWhenFalse when={numberOfPayments === 1}>
                    There are {numberOfPayments} {pluralize("payment", numberOfPayments)} due every{" "}
                    {!Number.isInteger(daysPerPayment) ? fixedDecimals(daysPerPayment, 2) : daysPerPayment}{" "}
                    {pluralize("day", daysPerPayment)} over a {Number(durationDays)} day period.
                  </ShowWhenFalse>
                </div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Interest</Label>
                <div className="font-bold text-base text-[#D0D0D0] mb-1">
                  {fixedDecimals(actualInterest, 3)} {state.context.token?.symbol}
                </div>
                <div className="text-[10px] text-[#9F9F9F] italic">
                  ({fixedDecimals(loanFee, 6)} {state.context.token?.symbol} fee)
                </div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Estimated APR (%)</Label>
                <div className="font-bold text-base text-[#D0D0D0] mb-1">
                  {displayEstimatedApr(state.context.estimatedApr)}
                </div>
                <div className="text-[10px] text-[#9F9F9F] italic">
                  {percent({ value: interestPerDay, decimalsWhenGteOne: 4, decimalsWhenLessThanOne: 4 })} per day
                </div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Offer Type</Label>
                <div className="font-bold text-base text-[#D0D0D0] capitalize">{mode}</div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Collateral Value</Label>
                <div className="font-bold text-base text-[#D0D0D0]">
                  {dollars({
                    value: state.context.collateralValue + Number(state?.context?.collateralValue1),
                  })}
                </div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">LTV Ratio</Label>
                <div className="font-bold text-base text-[#D0D0D0]">
                  {fixedDecimals(Number(state.context.ltvRatio), 2)}
                </div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Loan Value</Label>
                <div className="font-bold text-base text-[#D0D0D0]">
                  {dollars({
                    value: Number(state?.context?.tokenValue),
                  })}
                </div>
              </div>
            </div>

            {/* We will show different buttons depending on the state */}
            <ShowWhenTrue when={state.matches("confirmation")}>
              <div className="mt-8 p-4 flex justify-between">
                <Button variant="secondary" className="px-12" onClick={back}>
                  Back
                </Button>
                <Button
                  variant="action"
                  className="px-12"
                  onClick={() => {
                    send({ type: "confirm" })
                  }}
                >
                  Confirm
                </Button>
              </div>
            </ShowWhenTrue>

            <ShowWhenTrue when={state.matches("checkingBorrowAllowance") || state.matches("checkingLendAllowance")}>
              <div className="mt-8 p-4 flex justify-between">
                <Button variant="secondary" className="px-12" onClick={back}>
                  Back
                </Button>
                <Button variant="muted" className="pl-4 cursor-none">
                  Checking Allowance
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </div>
            </ShowWhenTrue>

            <ShowWhenTrue when={state.matches("approveBorrowAllowance") || state.matches("approveLendAllowance")}>
              <div className="px-4 mt-4">
                <Alert variant="info">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Action required</AlertTitle>
                  <AlertDescription>Please confirm the transaction in your wallet</AlertDescription>
                </Alert>
                <div className="mt-8 flex justify-between">
                  <Button variant="secondary" className="px-12" onClick={back}>
                    Back
                  </Button>
                  <Button variant="muted" className="pl-4 cursor-none">
                    Approving Allowance
                    <SpinnerIcon className="ml-2 animate-spin-slow" />
                  </Button>
                </div>
              </div>
            </ShowWhenTrue>

            <ShowWhenTrue
              when={state.matches("checkingBorrowAllowanceError") || state.matches("checkingLendAllowanceError")}
            >
              <div className="px-4">
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was an error approving your allowance, click the button to try again.
                  </AlertDescription>
                </Alert>
                <div className="mt-8 flex justify-between">
                  <Button variant="secondary" className="px-12" onClick={back}>
                    Back
                  </Button>
                  <Button
                    variant="error"
                    className="px-12 gap-2"
                    onClick={() => {
                      send({ type: "retry" })
                    }}
                  >
                    <XCircle className="h-5 w-5" />
                    Approve Allowance Failed - Retry?
                  </Button>
                </div>
              </div>
            </ShowWhenTrue>

            <ShowWhenTrue when={state.matches("creating")}>
              <div className="px-4">
                <div className="mt-8 flex justify-end">
                  <Button variant="action" className="px-12">
                    Confirming
                    <SpinnerIcon className="ml-2 animate-spin-slow" />
                  </Button>
                </div>
              </div>
            </ShowWhenTrue>

            <ShowWhenTrue when={state.matches("created")}>
              <div className="px-4">
                <Alert variant="success">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    {" "}
                    Your offer has been created, please wait and you will be redirected shortly.
                  </AlertDescription>
                </Alert>
                <div className="mt-8 flex justify-between">
                  <Button variant="secondary" className="px-12" onClick={back}>
                    Back
                  </Button>
                  <Link href={`/${isBorrowingMode ? "borrow-offer" : "lend-offer"}/${offerAddress}`}>
                    <Button variant="action" className="px-12">
                      View Offer
                    </Button>
                  </Link>
                </div>
              </div>
            </ShowWhenTrue>

            <ShowWhenTrue when={state.matches("error")}>
              <div className="px-4">
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was an error creating your offer, click the button to try again.
                  </AlertDescription>
                </Alert>
                <div className="mt-8 flex justify-between">
                  <Button variant="secondary" className="px-12" onClick={back}>
                    Back
                  </Button>
                  <Button
                    variant="error"
                    className="px-12 gap-2"
                    onClick={() => {
                      send({ type: "retry" })
                    }}
                  >
                    <XCircle className="h-5 w-5" />
                    Create Offer Failed - Retry?
                  </Button>
                </div>
              </div>
            </ShowWhenTrue>
          </div>
        </ShowWhenTrue>
      </div>
      <div className="flex flex-col md:w-1/2 w-full  md:mt-36">
        <div className="bg-[#21232B]/40 border-2 flex flex-col gap-2  w-full border-white/10  py-2 px-3 rounded-lg h-28 ">
          <div>Disclaimer</div>
          <div className="text-gray-400 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua.
          </div>
        </div>
      </div>
    </div>
  )
}

const NumberInput = ({
  send,
  event,
  min,
  max,
  initialValue,
  minFractionDigits,
}: {
  send: any
  event: string
  min: number
  max: number
  initialValue: number | undefined
  minFractionDigits: number
}) => {
  const [inputValue, setInputValue] = useState(initialValue?.toString() ?? "")

  useEffect(() => {
    setInputValue(initialValue?.toString() ?? "")
  }, [initialValue])

  return (
    <InputNumber
      value={Number(inputValue)}
      onValueChange={(e) => {
        send({ type: event, value: e.target.value })
      }}
      buttonLayout="horizontal"
      showButtons
      min={min}
      max={max}
      incrementButtonIcon={<LucidePlus className="h-3 w-4 stroke-2" />}
      decrementButtonIcon={<LucideMinus className="h-3 w-4 stroke-2" />}
      pt={{
        root: { className: "flex flex-row gap-2" },
        input: { root: { className: "bg-black/30 px-1 py-1.5 max-w-[100px] rounded-md text-center" } },
        decrementButton: { className: "order-first bg-black/80 px-2 py-2 rounded-md" },
        incrementButton: { className: "order-last bg-black/80 px-2 rounded-md py-2" },
      }}
      minFractionDigits={minFractionDigits}
    />
  )
}

const TokenValuation = ({
  token,
  amount,
  price,
  value,
  className,
}: {
  token: Token | undefined
  amount: number
  price: number
  value: number
  className?: string
}) => {
  if (!token || value === 0) {
    return null
  }

  return (
    <p className={cn("text-[10px] text-[#9F9F9F] mr-1", className)}>
      {amount} {token.symbol} @ {dollars({ value: price })} = {dollars({ value })}
    </p>
  )
}
