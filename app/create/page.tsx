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
import { Token, findInternalTokenBySymbol, getAllTokens, isNft, nftInfoLensType } from "@/lib/tokens"
import { cn, fixedDecimals } from "@/lib/utils"
import { ZERO_ADDRESS } from "@/services/constants"
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
import { approveVeToken, isVeTokenApprovedOrOwner } from "@/lib/nft"
import { useGetPoints } from "@/lib/getPoints"
import DisplayToken from "@/components/ux/display-token"
import { useBalanceUser } from "@/hooks/useBalanceUser"
// import { createBrowserInspector } from "@statelyai/inspect"

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

// const { inspect } = createBrowserInspector()
const displayEstimatedApr = (estimatedApr: number) => {
  return percent({
    value: estimatedApr ?? 0,
    decimalsWhenGteOne: 2,
    decimalsWhenLessThanOne: 2,
  })
}

// begin a little library of reusable web3 functions

export default function Create() {
  const config = useConfig()
  const [_id, setId] = useState<number>(0)
  const { address } = useControlledAddress()
  const currentChain = useCurrentChain()
  const wftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "wFTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])
  const [offerAddress, setAddress] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [perpetual, setPerpetual] = useState(false)

  // CREATE BORROW MACHINE

  const setOfferAddress = async (tx: any) => {
    let decoded = {}
    console.log("decoding..")
    try {
      setAddress(
        decodeEventLog({
          abi: parseAbi([
            "event CreateOffer(address indexed owner, address indexed _add, bool indexed senderIsLender)",
          ]),
          data: tx?.logs[2].data,
          topics: tx?.logs[2].topics,
        }).args._add
      )
      console.log("withdrawFromVault->decoded", decoded)
    } catch (error) {
      console.log("withdrawFromVault->decode error", error)
    }
  }

  const checkBorrowingAllowance = async (_context: any) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance
    const context = _context.input.context
    // collateralAmount of collateralToken
    if (context.collateralToken.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }
    if (isNft(context.collateralToken)) {
      console.log(context, "sBORRIG23")
      const hasPermissions = await isVeTokenApprovedOrOwner({
        veToken: context.collateralToken.address,
        spender: DEBITA_OFFER_FACTORY_ADDRESS,
        nftId: BigInt(_id),
      })

      if (hasPermissions) {
        return Promise.resolve({ hasPermissions })
      }

      throw "needs permission"
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

  const approveBorrowAllowance = async (_context: any) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance
    const context = _context.input.context
    console.log(context, "context")
    if (context.collateralToken.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    if (isNft(context.collateralToken)) {
      console.log("NFT")
      console.log("approveLendAllowance")

      return approveVeToken({
        veToken: context.collateralToken.address,
        spender: DEBITA_OFFER_FACTORY_ADDRESS,
        account: address as Address,
        nftId: BigInt(_id),
        publicClient: config.publicClient,
      })
    }
    const amountRequired = toDecimals(context.collateralAmount, context.collateralToken.decimals)

    try {
      const { request } = await config.publicClient.simulateContract({
        address: context.collateralToken.address,
        functionName: "approve",
        abi: erc20Abi,
        args: [DEBITA_OFFER_FACTORY_ADDRESS, amountRequired],
        account: address,
      })
      const executed = await writeContract(request)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

      return executed
    } catch (e) {
      back()
      console.log(e)
    }
    // console.log("approveBorrowAllowance", executed)
  }

  const creatingOffer = async ({ input }: { input: any }) => {
    const { context, event } = input

    //  value used in both modes
    const _interest = context.interestPercent * 100
    const _timelap = (86400 * context.durationDays) / context.numberOfPayments
    const _paymentCount = context.numberOfPayments

    try {
      const collateralAmount = toDecimals(state.context.collateralAmount ?? 0, context.collateralToken.decimals)

      const lenderAddress = context.token.address
      const collateralAddress = context.collateralToken.address
      const lenderAmount = toDecimals(state.context.tokenAmount ?? 0, context.token.decimals)

      // NFT info (if applicable)
      const isCollateralAssetNFT = isNft(context?.collateralToken)
      const isTokenAssetNFT = isNft(context?.token)
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
          nftInfoLensType(context.collateralToken) == "VeToken"
            ? collateralAmount
            : 0 /*  value of wanted veNFTs --> 0 for now*/,
          _paymentCount,
          _timelap,
          [isLendingMode, perpetual], // [0] --> isLending, [1] --> isPerpetual
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

  const checkingLendAllowance = async (_context: any) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance
    const context = _context.input.context
    console.log("PERMIS")

    // collateralAmount of collateralToken
    if (context.token.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    if (isNft(context.token)) {
      const hasPermissions = await isVeTokenApprovedOrOwner({
        veToken: context.token.address,
        spender: DEBITA_OFFER_FACTORY_ADDRESS,
        nftId: BigInt(_id),
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

  const approveLendAllowance = async (_context: any) => {
    // We need to know if we have enough allowance to create the offer
    // If the token is the native token (ZERO_ADDRESS) then we don't need to check the allowance
    const context = _context.input.context

    // collateralAmount of collateralToken
    if (context.token.address === ZERO_ADDRESS) {
      return Promise.resolve({ nativeToken: true })
    }

    if (isNft(context.token)) {
      console.log("NFT")
      console.log("approveLendAllowance")

      return approveVeToken({
        veToken: context.token.address,
        spender: DEBITA_OFFER_FACTORY_ADDRESS,
        account: address as Address,
        nftId: BigInt(_id),
        publicClient: config.publicClient,
      })

      // const { request } = await config.publicClient.simulateContract({
      //   address: context.token.address,
      //   functionName: "approve",
      //   abi: veTokenAbi,
      //   args: [DEBITA_OFFER_FACTORY_ADDRESS, _id],
      //   account: address,
      // })

      // const executed = await writeContract(request)
      // // console.log("approveLendAllowance", executed)
      // const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      // console.log("transaction", transaction)

      // return Promise.resolve(executed)
    } else {
      const amountRequired = toDecimals(context.tokenAmount, context.token.decimals)
      try {
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
      } catch (e) {
        back()
        console.log(e)
      }
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
    })
    // {
    //   inspect,
    // }
  )

  const mode = state.context.mode
  const isLendingMode = mode === ("lend" as LendingMode)
  const isBorrowingMode = mode === ("borrow" as LendingMode)
  const points = useGetPoints({
    token: state.context.token,
    loanValue: state.context.tokenValue as number,
    isBorrowMode: isBorrowingMode,
  })

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
  console.log(state.context, "STATE")
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
        setId(userNft.id)
        send({ type: "collateralAmount", value: userNft.amount })
        send({ type: "collateralUserNft", value: userNft })
      }
    },
    [send]
  )
  const onSelectTokenUserNft = useCallback(
    (userNft: UserNftInfo | null) => {
      if (userNft) {
        send({ type: "tokenUserNft", value: userNft })
        send({ type: "tokenAmount", value: userNft.amount })
      }
    },
    [send]
  )

  const onSelectTokenAmount = useCallback(
    (value: number | undefined) => {
      console.log(1)
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
  const lendingToken_Balance = useBalanceUser({ tokenAddress: state.context.token?.address, userAddress: address })
  const borrowToken_Balance = useBalanceUser({
    tokenAddress: state.context.collateralToken?.address,
    userAddress: address,
  })

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
            <TabsList className="bg-black rounded-b-none gap-2">
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
                  <ShowWhenFalse when={isNft(state.context.collateralToken)}>
                    <div className="flex  gap-1 text-xs items-center text-gray-400">
                      Your Balance
                      <div className="text-white">{borrowToken_Balance}</div>
                    </div>
                  </ShowWhenFalse>
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
                  isSelectableNft={isBorrowingMode}
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
                  <div className="flex  gap-1 text-xs items-center text-gray-400">
                    Your Balance
                    <div className="text-white">{lendingToken_Balance}</div>
                  </div>
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
                  isSelectableNft={isLendingMode}
                  hideNFT={true}
                />
              </div>
            </div>

            {/* Select interest */}

            {/* LTV Ratio */}
            <div>
              <Label variant="create">LTV Ratio</Label>
              <div className="grid sm:grid-cols-5 gap-4 sm:mt-0 mt-5">
                <Button
                  variant={state.matches("form.ltvRatio.ltv25") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    {
                      isLendingMode && isNft(state.context.token) ? "" : send({ type: "forceLtvRatio", value: 0.25 })
                    }
                  }}
                >
                  25%
                </Button>
                <Button
                  variant={state.matches("form.ltvRatio.ltv50") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    {
                      isLendingMode && isNft(state.context.token) ? "" : send({ type: "forceLtvRatio", value: 0.5 })
                    }
                  }}
                >
                  50%
                </Button>
                <Button
                  variant={state.matches("form.ltvRatio.ltv75") ? "option" : "option-muted"}
                  onClick={() => {
                    setLtvCustomInputValue("")
                    {
                      isLendingMode && isNft(state.context.token) ? "" : send({ type: "forceLtvRatio", value: 0.75 })
                    }
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

            <div className="grid sm:grid-cols-2 gap-4 gap-y-8 my-4">
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

            <div className="mt-4 flex md:flex-row flex-col md:text-start text-center items-center gap-5 justify-end">
              <ShowWhenTrue when={!state.can({ type: "next" })}>
                <div className="text-red-300 font-light text-sm">Please complete all the inputs correctly</div>
              </ShowWhenTrue>
              <div className="flex flex-col">
                <label className="relative inline-flex items-center cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    value=""
                    checked={perpetual}
                    onClick={() => setPerpetual(!perpetual)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-debitaPink"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Perpetual</span>
                </label>
              </div>
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
          <div className="bg-[#252324] relative p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
            <ShowWhenTrue
              when={
                (state.context.tokenPrice * Number(state.context.tokenAmount) > 500 ||
                  state.context.collateralPrice * Number(state.context.collateralAmount) > 500) &&
                !confirmed
              }
            >
              <div className="absolute top-0 right-0 left-0 bottom-0 bg-black/60 flex items-center justify-center font-bold z-10 ">
                Confirm warning
              </div>
            </ShowWhenTrue>
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

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Payments</Label>
                <div className="font-semibold text-sm text-[#D0D0D0]">
                  <div className="flex gap-2">Total payments: {state.context.numberOfPayments}</div>
                  <div className="flex gap-1  items-end ">
                    Amount per payment: {state.context.tokenAmount ?? 0 / numberOfPayments}{" "}
                    <span className="text-gray-500 text-xs">{state.context.token?.symbol}</span>
                  </div>
                  <div className="flex gap-1  items-end ">
                    Total amount: {state.context.tokenAmount ?? 0}{" "}
                    <span className="text-gray-500 text-xs">{state.context.token?.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 rounded-sm p-2">
                <Label variant="create">Length</Label>
                <div className="font-bold text-base text-[#D0D0D0]">
                  <div className="flex gap-2">
                    {durationDays} {pluralize("day", durationDays)}
                  </div>
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
                <div className="font-bold text-base text-[#D0D0D0] flex gap-3">
                  {dollars({
                    value: state.context.collateralValue,
                  })}
                  <div className=" opacity-60 flex w-96">
                    ({" "}
                    <DisplayToken
                      size={22}
                      token={state.context.collateralToken as Token}
                      chainSlug={currentChain.slug}
                      amount={state.context.collateralAmount}
                    />
                    )
                  </div>
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
                <div className="font-bold text-base text-[#D0D0D0] flex gap-3 min-w-min">
                  {dollars({
                    value: Number(state?.context?.tokenValue),
                  })}

                  <div className=" opacity-60 flex min-w-min">
                    ({" "}
                    <DisplayToken
                      size={22}
                      token={state.context.token as Token}
                      chainSlug={currentChain.slug}
                      amount={state.context.tokenAmount}
                    />
                    )
                  </div>
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
      <div className="flex flex-col md:w-1/2 w-full  gap-4 md:mt-36">
        <div className="bg-[#21232B]/40 border-2 flex flex-col md:py-3  w-full border-white/10  py-3 px-3 rounded-lg md:h-28 ">
          <div>Disclaimer</div>
          <div className="text-gray-400 text-sm">
            The $ value and LTV are based on off chain data, and may not be accurate at times. It is highly suggested to
            verify token values independently.
          </div>
        </div>

        <ShowWhenTrue
          when={
            (state.context.tokenPrice * Number(state.context.tokenAmount) > 500 ||
              state.context.collateralPrice * Number(state.context.collateralAmount) > 500) &&
            !confirmed
          }
        >
          <div className="bg-debitaPink/40 border-2 flex flex-col  w-full border-white/10  py-3 px-3 rounded-lg h-32 ">
            <div className=" font-bold">High amount warning</div>
            <div className="text-gray-200 text-sm">
              If you wish to continue please confirm that you have done your own due diligence and accept the risks
              described in our terms and conditions
              <div className="py-3 flex items-center ">
                <div
                  className="bg-black px-2 py-1 cursor-pointer hover:scale-[1.04] rounded transition-all"
                  onClick={() => setConfirmed(true)}
                >
                  Confirm
                </div>
              </div>
            </div>
          </div>
        </ShowWhenTrue>
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
          <div className="bg-[#32282D]/40 border border-[#743A49] flex flex-col   w-full   py-3 px-3 rounded-lg h-28 animate-enter-div">
            <div>Points</div>
            <div className="text-gray-400 text-sm">
              If this offer is fully accepted, you&apos;ll earn{" "}
              <span className="text-white font-bold">{points} DBT Points</span>! (Points rewards can fluctuate based on
              multipliers and market condicions)
            </div>
          </div>
        </ShowWhenTrue>
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
      {amount.toFixed(2)} {token.symbol} @ {dollars({ value: price })} = {dollars({ value })}
    </p>
  )
}
