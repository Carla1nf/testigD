"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SelectToken from "@/components/ux/select-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { dollars } from "@/lib/display"
import { Token, findInternalTokenBySymbol } from "@/lib/tokens"
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

  const onSelectCollateralToken0 = useCallback(
    (token: Token | null) => {
      if (token) {
        machineSend({ type: "collateralToken0", value: token })
      }
    },
    [machineSend]
  )

  const onSelectCollateralAmount0 = useCallback(
    (value: number) => {
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
    (value: number) => {
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
            defaultToken={ftm as Token}
            onSelectToken={onSelectCollateralToken0}
            onTokenValueChange={onSelectCollateralAmount0}
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
            defaultToken={usdc as Token}
            onSelectToken={onSelectToken}
            onTokenValueChange={onSelectTokenAmount}
          />
        </div>

        {/* LTV Ratio */}
        <div>
          <Label variant="create">LTV Ratio</Label>
          <div className="grid grid-cols-5 gap-4">
            <Button variant={machineState.matches("form.ltvRatio.ltv25") ? "action" : "action-muted"}>25%</Button>
            <Button variant={machineState.matches("form.ltvRatio.ltv50") ? "action" : "action-muted"}>50%</Button>
            <Button variant={machineState.matches("form.ltvRatio.ltv75") ? "action" : "action-muted"}>75%</Button>
            <Button variant={machineState.matches("form.ltvRatio.ltvcustom") ? "action" : "action-muted"}>
              Custom
            </Button>
            <div>
              <Input
                variant={machineState.matches("form.ltvRatio.ltvcustom") ? "action" : "action-muted"}
                className="text-center"
                placeholder="0"
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
    <p className={cn("text-xs text-[#9F9F9F]", className)}>
      {amount} {token.symbol} @ {dollars({ value: price })} = {dollars({ value })}
    </p>
  )
}
