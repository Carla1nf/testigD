"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import SelectToken from "@/components/ux/select-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { dollars } from "@/lib/display"
import { Token, findInternalTokenBySymbol, getAllTokens } from "@/lib/tokens"
import { cn, fixedDecimals } from "@/lib/utils"
import { useMachine } from "@xstate/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { machine } from "./create-offer-machine"
import { waitFor } from "xstate"

export default function Create() {
  const currentChain = useCurrentChain()
  const ftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "FTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])

  // CREATE BORROW MACHINE
  const [machineState, machineSend] = useMachine(machine)
  const [ltvCustomInputValue, setLtvCustomInputValue] = useState("")
  const ltvCustomInputRef = useRef<HTMLInputElement>(null)

  /**
   * The user can enter an LTV ratio manually, and have the field calculated when they alter the amount field.
   * This leads to circular logic so we need to detect which sceanrio is happening and react accordingly.
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
      setLtvCustomInputValue(fixedDecimals(machineState?.context?.ltvRatio ?? 0, 4).toString())
    }
  }, [machineState.context.ltvRatio, ltvCustomInputRef.current])

  useEffect(() => {
    if (ftm && machineState.context.collateralToken0 === undefined) {
      machineSend({ type: "collateralToken0", value: ftm })
    }
    if (usdc && machineState.context.token === undefined) {
      machineSend({ type: "token", value: usdc })
    }
  }, [ftm, usdc, machineState.context.collateralToken0, machineSend])

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

  return (
    <div>
      <h1 className="">Create</h1>
      <p className="mb-16">
        Let&apos;s keep this simple for now, we will just create a form and hook it up to the xstate machine
      </p>

      <Tabs
        defaultValue="borrow"
        className=""
        onValueChange={(value: any) => {
          machineSend({ type: "mode", value })
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
      <div className="bg-[#252324] p-8 pt-8 max-w-[570px] flex flex-col gap-6 rounded-b-lg">
        {/* Collateral token 0 */}
        <div className="">
          <div className="flex justify-between items-center">
            <ShowWhenTrue when={machineState.matches("form.mode.borrow")}>
              <Label variant="create">Your Collateral Token</Label>
            </ShowWhenTrue>
            <ShowWhenTrue when={machineState.matches("form.mode.lend")}>
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
            <ShowWhenTrue when={machineState.matches("form.mode.borrow")}>
              <Label variant="create">Wanted Borrow Token</Label>
            </ShowWhenTrue>
            <ShowWhenTrue when={machineState.matches("form.mode.lend")}>
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

        <div className="grid grid-cols-3 gap-4 my-4">
          <div className="">
            <Label variant="create">Interest on Loan (%)</Label>
            <div className="flex flex-row gap-[6px]">
              <Button variant="action" className="w-8 h-8">
                -
              </Button>
              <Input variant="create-secondary" className="text-center w-20 h-8" placeholder="0" />
              <Button variant="action" className="w-8 h-8">
                +
              </Button>
            </div>
          </div>

          <div className="">
            <Label variant="create">Loan Duration (days)</Label>
            <div className="flex flex-row gap-[6px]">
              <Button variant="action" className="w-8 h-8">
                -
              </Button>
              <Input variant="create-secondary" className="text-center w-20 h-8" placeholder="0" />
              <Button variant="action" className="w-8 h-8">
                +
              </Button>
            </div>
          </div>

          <div className="">
            <Label variant="create">Total Payments</Label>
            <div className="flex flex-row gap-[6px]">
              <Button variant="action" className="w-8 h-8">
                -
              </Button>
              <Input variant="create-secondary" className="text-center w-20 h-8" placeholder="0" />
              <Button variant="action" className="w-8 h-8">
                +
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
