"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SelectToken from "@/components/ux/select-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { dollars } from "@/lib/display"
import { Token, findInternalTokenBySymbol, getAllTokens } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { useMachine } from "@xstate/react"
import { useCallback, useEffect, useMemo } from "react"
import { machine } from "./create-offer-machine"

export default function Create() {
  const currentChain = useCurrentChain()
  const ftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "FTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])

  // CREATE BORROW MACHINE
  const [machineState, machineSend] = useMachine(machine)

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

  // console.log("MACHINE ")
  // console.log("collateralToken0", machineState.context.collateralToken0)
  // console.log("collateralAmount0", machineState.context.collateralAmount0)
  // console.log("collateralPrice0", machineState.context.collateralPrice0)
  // console.log("collateralValue0", machineState.context.collateralValue0)

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

      {/* Form */}
      <div className="bg-[#252324] p-4 max-w-[570px] flex flex-col gap-6">
        {/* Collateral token 0 */}
        <div className="">
          <div className="flex justify-between items-center">
            <Label variant="create">Your Collateral Token</Label>
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
            <Label variant="create">Wanted Borrow Token</Label>
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
                machineSend({ type: "forceLtvRatio", value: 0.25 })
              }}
            >
              25%
            </Button>
            <Button
              variant={machineState.matches("form.ltvRatio.ltv50") ? "action" : "action-muted"}
              onClick={() => {
                machineSend({ type: "forceLtvRatio", value: 0.5 })
              }}
            >
              50%
            </Button>
            <Button
              variant={machineState.matches("form.ltvRatio.ltv75") ? "action" : "action-muted"}
              onClick={() => {
                machineSend({ type: "forceLtvRatio", value: 0.75 })
              }}
            >
              75%
            </Button>
            <Button variant={machineState.matches("form.ltvRatio.ltvcustom") ? "action" : "action-muted"}>
              Custom
            </Button>
            <div>
              <Input
                variant={machineState.matches("form.ltvRatio.ltvcustom") ? "action" : "action-muted"}
                className="text-center"
                placeholder="0"
                value={machineState.context.ltvRatio?.toFixed(2)}
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
    <p className={cn("text-[10px] text-[#9F9F9F]", className)}>
      {amount} {token.symbol} @ {dollars({ value: price })} = {dollars({ value })}
    </p>
  )
}
