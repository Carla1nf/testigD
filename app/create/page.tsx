"use client"

import { useMachine } from "@xstate/react"
import { fromPromise } from "xstate"
import { machine } from "./create-offer-machine"
import SelectToken from "@/components/ux/select-token"
import { Token, findInternalTokenBySymbol } from "@/lib/tokens"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Create() {
  const currentChain = useCurrentChain()
  // CREATE BORROW MACHINE

  const [machineState, machineSend] = useMachine(machine.provide({}))
  const ftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "FTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "axlUSDC"), [currentChain.slug])

  // @ts-ignore
  console.log("machineState", machineState.value.form)

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
            onSelectToken={(token: Token | null) => {
              console.log("onSelectToken->token", token)
            }}
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
            onSelectToken={(token: Token | null) => {
              console.log("onSelectToken->token", token)
            }}
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
            onSelectToken={(token: Token | null) => {
              console.log("onSelectToken->token", token)
            }}
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
              <Input variant="action" className="text-center" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
