"use client"

import { useMachine } from "@xstate/react"
import { fromPromise } from "xstate"
import { machine } from "./create-offer-machine"
import SelectToken from "@/components/ux/select-token"
import { Token, findInternalTokenBySymbol } from "@/lib/tokens"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Create() {
  const currentChain = useCurrentChain()
  // CREATE BORROW MACHINE

  const [machineState, machineSend] = useMachine(machine)
  const ftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "FTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])

  console.log("context", machineState.context)
  // @ts-ignore
  // console.log("machineState", machineState.value.form)

  const onSelectCollateralToken0 = useCallback(
    (token: Token | null) => {
      if (token) {
        machineSend({ type: "collateralToken0", value: token })
      }
    },
    [machineSend]
  )
  const onSelectCollateralToken1 = useCallback(
    (token: Token | null) => {
      if (token) {
        machineSend({ type: "collateralToken1", value: token })
      }
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
          <Label variant="create">Your Collateral Token</Label>
          {/* select token */}
          <SelectToken
            defaultToken={ftm as Token}
            onSelectToken={onSelectCollateralToken0}
            onTokenValueChange={(value: number) => {
              console.log("onTokenValueChange->value", value)
            }}
          />
        </div>

        {/* Collateral token 1 */}
        {/* <div className="">
          <Label variant="create-muted">Your Second Collateral Token</Label>
          <SelectToken
            defaultToken={ftm as Token}
            onSelectToken={onSelectCollateralToken1}
            onTokenValueChange={(value: number) => {
              console.log("onTokenValueChange->value", value)
            }}
          />
        </div> */}

        {/* Wanted borrow token */}
        <div className="">
          <Label variant="create">Wanted Borrow Token</Label>
          {/* select token */}
          <SelectToken
            defaultToken={usdc as Token}
            onSelectToken={onSelectToken}
            onTokenValueChange={(value: number) => {
              console.log("onTokenValueChange->value", value)
            }}
          />
        </div>

        {/* LTV Ratio */}
        <div>
          <Label variant="create">LTV Ratio</Label>
          <div className="grid grid-cols-5 gap-4">
            <Button variant="action-muted">25%</Button>
            <Button variant="action">50%</Button>
            <Button variant="action">75%</Button>
            <Button variant="action">Custom</Button>
            <div>
              <Input variant="action" className="text-center" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 my-4">
          {/* Interest on Loan (%) */}

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
