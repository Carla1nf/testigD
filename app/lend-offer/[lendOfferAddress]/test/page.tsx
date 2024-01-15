"use client"

/**
 * Test machine and UI components page for the lend-offer route
 */
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useInternalToken } from "@/hooks/useInternalToken"
import { createBrowserInspector } from "@statelyai/inspect"
import { useMachine } from "@xstate/react"
import { LucideArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { fromPromise } from "xstate"
import NotOwnerInfo from "../components/not-owner-info"
import OwnerCancelButtons from "../components/owner-cancel-buttons"
import { machine } from "../lend-offer-machine"
import { Token } from "@/lib/tokens"

const { inspect } = createBrowserInspector()

type ResponseMode = "ACCEPT" | "REJECT" | "WAITING"

export default function TestLendOffer() {
  const [nextStepShould, setNextStepShould] = useState<ResponseMode>("WAITING")
  const [resolveRejectPromise, setResolveRejectPromise] = useState<{
    resolve: () => void
    reject: (reason?: any) => void
  } | null>(null)

  const borrowingToken = useInternalToken("fantom", "WFTM") as Token

  // Function to wait for the state change
  const waitForStateChange = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setResolveRejectPromise({ resolve, reject })
    })
  }

  useEffect(() => {
    if (nextStepShould !== "WAITING" && resolveRejectPromise) {
      if (nextStepShould === "ACCEPT") {
        resolveRejectPromise.resolve()
      } else if (nextStepShould === "REJECT") {
        resolveRejectPromise.reject("Rejected")
      }
      setResolveRejectPromise(null) // Reset for next time
    }
  }, [nextStepShould, resolveRejectPromise])

  const response = async () => {
    return Promise.resolve()
  }

  const [state, send] = useMachine(
    machine.provide({
      actors: {
        acceptOffer: fromPromise(waitForStateChange),
        cancelOffer: fromPromise(waitForStateChange),
        increaseCollateralAllowance: fromPromise(waitForStateChange),
        checkPrincipleAllowance: fromPromise(waitForStateChange),
        increasePrincipleAllowance: fromPromise(waitForStateChange),
        updateOffer: fromPromise(waitForStateChange),
      },
    }),
    { inspect }
  )

  // console.log("state", state)

  return (
    <div className="space-y-4">
      <StateCrumbs value={state.value} />

      {/* Form */}
      <Buttons>
        <span>Next step?</span>

        <RadioGroup defaultValue={"WAITING"} className="flex flex-row gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="WAITING" id="WAITING" onClick={() => setNextStepShould("WAITING")} />
            <Label htmlFor="WAITING">Waiting</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ACCEPT" id="ACCEPT" onClick={() => setNextStepShould("ACCEPT")} />
            <Label htmlFor="ACCEPT">Accept</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="REJECT" id="REJECT" onClick={() => setNextStepShould("REJECT")} />
            <Label htmlFor="REJECT">Reject</Label>
          </div>
        </RadioGroup>
      </Buttons>

      {/* Possible actions */}
      {state._nodes.map((node) => {
        // console.log("node", node)
        if (!node?.transitions) {
          return null
        }

        const buttons = []
        // @ts-ignore
        for (const key of node?.transitions.keys()) {
          buttons.push(
            <Button variant="outline" onClick={() => send({ type: key })} key={key}>
              {key}
            </Button>
          )
        }
        if (buttons.length) {
          return (
            <Card className="p-4 bg-secondary" key={node.key}>
              <div className="space-y-4">
                <div>{node.key}</div>
                <Buttons>{buttons}</Buttons>
              </div>
            </Card>
          )
        }
        return null
      })}

      <div className="text-2xl">Components</div>
      <div className="text-xl">OwnerCancelButtons</div>
      <OwnerCancelButtons state={state} send={send} />
      <div className="text-xl">NotOwnerInfo</div>
      <NotOwnerInfo
        state={state}
        borrowingToken={borrowingToken}
        ownerAddress={"0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83"}
      />
    </div>
  )
}

const Buttons = ({ children }: { children: React.ReactNode }) => <div className="flex flex-row gap-2">{children}</div>

/**
 * Supports two level machines max
 * @returns
 */
const StateCrumbs = ({ value }: { value: any }) => {
  const results = Object.entries(value)
  const [top, first] = results[0]

  return (
    <div className="flex flex-row gap-2 items-center text-accent-foreground text-2xl mb-8">
      <div>{top as string}</div>
      <LucideArrowRight className="w-4 h-4" />
      <div>{first as string}</div>
    </div>
  )

  return null
}
