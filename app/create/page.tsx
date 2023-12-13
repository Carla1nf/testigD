"use client"

import { useMachine } from "@xstate/react"
import { fromPromise } from "xstate"
import { machine } from "./create-offer-machine"
import SelectToken from "@/components/ux/select-token"
import { Token, findInternalTokenBySymbol } from "@/lib/tokens"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useMemo } from "react"
import { Label } from "@/components/ui/label"

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
        <div className="flex flex-row">
          <div className="w-full">
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
        </div>

        {/* Collateral token 1 */}
        <div className="flex flex-row">
          <div className="w-full">
            <Label variant="create-muted">Your Second Collateral Token</Label>
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
        </div>

        {/* Wanted borrow token */}
        <div className="flex flex-row">
          <div className="w-full">
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
        </div>
      </div>
    </div>
  )
}
