"use client"

import { DebitaIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShowWhenFalse, ShowWhenTrue } from "@/components/ux/conditionals"
import SelectToken from "@/components/ux/select-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { dollars, percent } from "@/lib/display"
import { Token, findInternalTokenBySymbol, getAllTokens } from "@/lib/tokens"
import { cn, fixedDecimals } from "@/lib/utils"
import { useMachine } from "@xstate/react"
import { AlertCircle, CheckCircle2, LucideMinus, LucidePlus, XCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { machine } from "./create-offer-machine"
import { modeMachine } from "./mode-machine"
import { InputNumber } from "primereact/inputnumber"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const displayEstimatedApr = (estimatedApr: number) => {
  return percent({
    value: estimatedApr ?? 0,
    decimalsWhenGteOne: 2,
    decimalsWhenLessThanOne: 2,
  })
}
export default function Create() {
  const currentChain = useCurrentChain()
  const ftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "FTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])

  // MODE MACHINE
  const [modeState, modeSend] = useMachine(modeMachine)

  // todo: define the createOfferTransaction function (via useQuery) and pass it into the state machine

  // CREATE BORROW MACHINE
  const [machineState, machineSend] = useMachine(machine)
  const [ltvCustomInputValue, setLtvCustomInputValue] = useState("")
  const ltvCustomInputRef = useRef<HTMLInputElement>(null)

  // console.log("context", machineState.context)
  // console.log("machineState.value", machineState.value)

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
      machineState.context.ltvRatio !== parseFloat(ltvCustomInputValue) &&
      !ltvCustomInputRef.current.matches(":focus")
    ) {
      setLtvCustomInputValue(fixedDecimals(machineState?.context?.ltvRatio ?? 0, 3).toString())
    }
  }, [machineState.context.ltvRatio, ltvCustomInputValue])

  useEffect(() => {
    if (ftm && machineState.context.collateralToken0 === undefined) {
      machineSend({ type: "collateralToken0", value: ftm })
    }
    if (usdc && machineState.context.token === undefined) {
      machineSend({ type: "token", value: usdc })
    }
  }, [ftm, usdc, machineState.context.collateralToken0, machineSend, machineState.context.token])

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
        machineSend({ type: "collateralToken0", value: token })
      }
    },
    [machineSend]
  )

  const onSelectCollateralAmount0 = useCallback(
    (value: number | undefined) => {
      machineSend({ type: "collateralAmount0", value })
    },
    [machineSend]
  )

  const onSelectToken = useCallback(
    (token: Token | null) => {
      if (token) {
        machineSend({ type: "token", value: token })
      }
    },
    [machineSend]
  )
  const onSelectTokenAmount = useCallback(
    (value: number | undefined) => {
      machineSend({ type: "tokenAmount", value })
    },
    [machineSend]
  )

  // quick calcs - move to machine later
  const numberOfPayments = Number(machineState.context.numberOfPayments)
  const durationDays = Number(machineState.context.durationDays)
  const daysPerPayment = durationDays / numberOfPayments
  const loanAmount = Number(machineState.context.tokenAmount)
  const totalLoanInterest = loanAmount * (Number(machineState.context.interestPercent) / 100)
  const loanFee = totalLoanInterest * 0.06
  const actualInterest = totalLoanInterest - loanFee

  return (
    <div>
      <h1 className="">Create</h1>
      <p className="mb-16">
        Let&apos;s keep this simple for now, we will just create a form and hook it up to the xstate machine
      </p>

      <Tabs
        defaultValue="borrow"
        className=""
        onValueChange={() => {
          modeSend({ type: "mode" })
        }}
      >
        <TabsList className="bg-[#252324] rounded-b-none gap-2">
          <TabsTrigger value="borrow" className="px-12">
            Borrow
          </TabsTrigger>
          <TabsTrigger value="lend" className="px-12">
            Lend
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Form */}
      <ShowWhenTrue when={machineState.matches("form")}>
        <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
          {/* Collateral token 0 */}
          <div className="">
            <div className="flex justify-between items-center">
              <ShowWhenTrue when={modeState.matches("borrow")}>
                <Label variant="create">Your Collateral Token</Label>
              </ShowWhenTrue>
              <ShowWhenTrue when={modeState.matches("lend")}>
                <Label variant="create">Wanted Collateral Token</Label>
              </ShowWhenTrue>
              <TokenValuation
                token={machineState.context.collateralToken0}
                price={machineState.context.collateralPrice0}
                amount={Number(machineState.context.collateralAmount0)}
                value={machineState.context.collateralValue0}
                className="mb-2 italic"
              />
            </div>
            <SelectToken
              tokens={tokens}
              amount={machineState.context.collateralAmount0}
              defaultToken={ftm as Token}
              selectedToken={machineState.context.collateralToken0}
              onSelectToken={onSelectCollateralToken0}
              onAmountChange={onSelectCollateralAmount0}
            />
          </div>

          {/* Wanted borrow token */}
          <div className="">
            <div className="flex justify-between items-center">
              <ShowWhenTrue when={modeState.matches("borrow")}>
                <Label variant="create">Wanted Borrow Token</Label>
              </ShowWhenTrue>
              <ShowWhenTrue when={modeState.matches("lend")}>
                <Label variant="create">Your Lending Token</Label>
              </ShowWhenTrue>
              <TokenValuation
                token={machineState.context.token}
                price={machineState.context.tokenPrice}
                amount={Number(machineState.context.tokenAmount)}
                value={Number(machineState.context.tokenValue)}
                className="mb-2 italic"
              />
            </div>
            <SelectToken
              tokens={tokens}
              amount={machineState.context.tokenAmount}
              selectedToken={machineState.context.token}
              defaultToken={usdc as Token}
              onSelectToken={onSelectToken}
              onAmountChange={onSelectTokenAmount}
            />
          </div>

          {/* LTV Ratio */}
          <div>
            <Label variant="create">LTV Ratio</Label>
            <div className="grid grid-cols-5 gap-4">
              <Button
                variant={machineState.matches("form.ltvRatio.ltv25") ? "action" : "action-muted"}
                onClick={() => {
                  setLtvCustomInputValue("")
                  machineSend({ type: "forceLtvRatio", value: 0.25 })
                }}
              >
                25%
              </Button>
              <Button
                variant={machineState.matches("form.ltvRatio.ltv50") ? "action" : "action-muted"}
                onClick={() => {
                  setLtvCustomInputValue("")
                  machineSend({ type: "forceLtvRatio", value: 0.5 })
                }}
              >
                50%
              </Button>
              <Button
                variant={machineState.matches("form.ltvRatio.ltv75") ? "action" : "action-muted"}
                onClick={() => {
                  setLtvCustomInputValue("")
                  machineSend({ type: "forceLtvRatio", value: 0.75 })
                }}
              >
                75%
              </Button>
              <Button
                variant={machineState.matches("form.ltvRatio.ltvcustom") ? "action" : "action-muted"}
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
                  variant={machineState.matches("form.ltvRatio.ltvcustom") ? "action" : "action-muted"}
                  className="text-center"
                  placeholder="0"
                  value={ltvCustomInputValue}
                  onFocus={() => {
                    machineSend({ type: "ltv.custom" })
                  }}
                  onBlur={() => {
                    const value = parseFloat(ltvCustomInputValue || "0")
                    if (!Number.isNaN(value)) {
                      machineSend({ type: "forceLtvRatio", value: value / 100 })
                    }
                  }}
                  onChange={(e) => {
                    const re = /^[0-9]*\.?[0-9]*$/
                    if (e.target.value === "" || re.test(e.target.value)) {
                      setLtvCustomInputValue(e.target.value)
                      const value = parseFloat(e.target.value || "0")
                      if (!Number.isNaN(value)) {
                        machineSend({ type: "forceLtvRatio", value: value / 100 })
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 gap-y-8 my-4">
            <div className="">
              <Label variant="create">Interest on Loan (%)</Label>
              <NumberInput
                min={0}
                max={100000}
                send={machineSend}
                event="interestPercent"
                initialValue={machineState.context.interestPercent}
                minFractionDigits={2}
              />
            </div>

            <div className="flex flex-col justify-between">
              <Label variant="create">Estimated APR (%)</Label>
              <div className="text-[#9F9F9F] text-lg font-bold">
                {displayEstimatedApr(machineState.context.estimatedApr)}
              </div>
            </div>
            <div className="">
              <Label variant="create">Loan Duration (days)</Label>
              <NumberInput
                min={0}
                max={365}
                send={machineSend}
                event="durationDays"
                initialValue={machineState.context.durationDays}
                minFractionDigits={0}
              />
            </div>

            <div className="">
              <Label variant="create">Total Payments</Label>
              <NumberInput
                min={0}
                max={10}
                send={machineSend}
                event="numberOfPayments"
                initialValue={machineState.context.numberOfPayments}
                minFractionDigits={0}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="action"
              className="px-12"
              disabled={!machineState.can({ type: "next" })}
              onClick={() => {
                machineSend({ type: "next" })
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </ShowWhenTrue>

      <ShowWhenTrue when={machineState.matches("confirmation")}>
        <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
          <div className="mb-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row gap-2 items-center">
                <div className="text-xl font-bold">
                  <ShowWhenTrue when={modeState.matches("borrow")}>Confirm Borrow Offer</ShowWhenTrue>
                  <ShowWhenTrue when={modeState.matches("lend")}>Confirm Lend Offer</ShowWhenTrue>
                </div>
                <CheckCircle2 className="stroke-[#5E568F] flex-grow" />
              </div>
              <DebitaIcon className="h-11 w-11 flex-basis-1" />
            </div>

            <hr className="h-px mt-4 bg-[#4D4348] border-0" />
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-4">
            <div className="border border-white/10 rounded-sm p-2 col-span-2">
              <Label variant="create">Payments</Label>
              <div className="font-bold text-base text-[#D0D0D0]">
                <ShowWhenTrue when={numberOfPayments === 1}>
                  There is a single payment due after {durationDays} days.
                </ShowWhenTrue>
                <ShowWhenFalse when={numberOfPayments === 1}>
                  There are {numberOfPayments} payments due every {daysPerPayment} days over {Number(durationDays)}{" "}
                  days.
                </ShowWhenFalse>
              </div>
            </div>

            {/* <div className="border border-white/10 rounded-sm p-2">
              <Label variant="create">Total Interest </Label>
              <div className="font-bold text-base text-[#D0D0D0] mb-1">
                {totalLoanInterest} {machineState.context.token?.symbol}
              </div>
            </div> */}

            <div className="border border-white/10 rounded-sm p-2">
              <Label variant="create">Interest</Label>

              <div className="font-bold text-base text-[#D0D0D0] mb-1">
                {actualInterest} {machineState.context.token?.symbol}
              </div>
              <div className="text-[10px] text-[#9F9F9F] italic">
                ({loanFee} {machineState.context.token?.symbol} fee)
              </div>
            </div>

            <div className="border border-white/10 rounded-sm p-2">
              <Label variant="create">Estimated APR (%)</Label>
              <div className="font-bold text-base text-[#D0D0D0]">
                {displayEstimatedApr(machineState.context.estimatedApr)}
              </div>
            </div>

            <div className="border border-white/10 rounded-sm p-2">
              <Label variant="create">Offer Type</Label>
              <div className="font-bold text-base text-[#D0D0D0] capitalize">{modeState.value.toString()}</div>
            </div>

            <div className="border border-white/10 rounded-sm p-2">
              <Label variant="create">LTV Ratio</Label>
              <div className="font-bold text-base text-[#D0D0D0]">
                {fixedDecimals(Number(machineState.context.ltvRatio), 2)}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 flex justify-between">
            <Button
              variant="secondary"
              className="px-12"
              onClick={() => {
                machineSend({ type: "back" })
              }}
            >
              Back
            </Button>
            <Button
              variant="action"
              className="px-12"
              onClick={() => {
                machineSend({ type: "confirm" })
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </ShowWhenTrue>

      <ShowWhenTrue when={machineState.matches("creating")}>
        <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
          <div className="mb-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row gap-2 items-center">
                <div className="text-xl font-bold">
                  <ShowWhenTrue when={modeState.matches("borrow")}>Confirming Borrow Offer</ShowWhenTrue>
                  <ShowWhenTrue when={modeState.matches("lend")}>Confirming Lend Offer</ShowWhenTrue>
                </div>
                <CheckCircle2 className="stroke-[#5E568F] flex-grow" />
              </div>
              <DebitaIcon className="h-11 w-11 flex-basis-1" />
            </div>

            <hr className="h-px mt-4 bg-[#4D4348] border-0" />
          </div>

          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action required</AlertTitle>
            <AlertDescription>Please confirm the transaction in your wallet</AlertDescription>
          </Alert>

          <div className="mt-8 p-4 flex justify-end">
            <Button variant="action" className="px-12">
              Confirming
              <SpinnerIcon className="ml-2 animate-spin-slow" />
            </Button>
          </div>
        </div>
      </ShowWhenTrue>

      <ShowWhenTrue when={machineState.matches("created")}>
        <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
          <div className="mb-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row gap-2 items-center">
                <div className="text-xl font-bold">
                  <ShowWhenTrue when={modeState.matches("borrow")}>Created Borrow Offer</ShowWhenTrue>
                  <ShowWhenTrue when={modeState.matches("lend")}>Created Lend Offer</ShowWhenTrue>
                </div>
                <CheckCircle2 className="stroke-[#5E568F] flex-grow" />
              </div>
              <DebitaIcon className="h-11 w-11 flex-basis-1" />
            </div>

            <hr className="h-px mt-4 bg-[#4D4348] border-0" />
          </div>

          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your offer has been created, please wait and you will be redirected shortly.
            </AlertDescription>
          </Alert>

          <div className="mt-8 p-4 flex justify-end">
            <Button
              variant="action"
              className="px-12"
              onClick={() => {
                alert("not implemented yet")
              }}
            >
              View Offer
            </Button>
          </div>
        </div>
      </ShowWhenTrue>

      <ShowWhenTrue when={machineState.matches("error")}>
        <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-8 rounded-b-lg">
          <div className="mb-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row gap-2 items-center">
                <div className="text-xl font-bold">
                  <ShowWhenTrue when={modeState.matches("borrow")}>Creating Borrow Offer</ShowWhenTrue>
                  <ShowWhenTrue when={modeState.matches("lend")}>Creating Lend Offer</ShowWhenTrue>
                </div>
                <CheckCircle2 className="stroke-[#5E568F] flex-grow" />
              </div>
              <DebitaIcon className="h-11 w-11 flex-basis-1" />
            </div>

            <hr className="h-px mt-4 bg-[#4D4348] border-0" />
          </div>

          <Alert variant="warning">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>There was an error creating your offer, click the button to try again.</AlertDescription>
          </Alert>

          <div className="mt-8 p-4 flex justify-center">
            <Button
              variant="error"
              className="px-12 gap-2"
              onClick={() => {
                machineSend({ type: "retry" })
              }}
            >
              <XCircle className="h-5 w-5" />
              Create Offer Failed - Retry?
            </Button>
          </div>
        </div>
      </ShowWhenTrue>
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
        input: { root: { className: "bg-[#352E49] px-1 py-1 max-w-[100px] rounded-md text-center" } },
        decrementButton: { className: "order-first action-gradient px-2 py-2 rounded-md" },
        incrementButton: { className: "order-last action-gradient px-2 rounded-md py-2" },
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
