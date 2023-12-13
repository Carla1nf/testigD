"use client"

import { useMachine } from "@xstate/react"
import { fromPromise } from "xstate"
import { machine } from "./create-offer-machine"
import SelectToken from "@/components/ux/select-token"
import { Token, findInternalTokenBySymbol } from "@/lib/tokens"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useMemo } from "react"

export default function Create() {
  const currentChain = useCurrentChain()
  // CREATE BORROW MACHINE

  const [machineState, machineSend] = useMachine(machine.provide({}))
  const ftm = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "FTM"), [currentChain.slug])
  const usdc = useMemo(() => findInternalTokenBySymbol(currentChain.slug, "USDC"), [currentChain.slug])

  // @ts-ignore
  console.log("machineState", machineState.value.form)

  return (
    <div>
      <h1 className="">Create</h1>
      <p>Let&apos;s keep this simple for now, we will just create a form and hook it up to the xstate machine</p>

      {/* Form */}
      <div>
        {/* Collateral token 0 */}
        <div className="flex flex-row">
          <div>
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
      </div>
    </div>
  )
}
