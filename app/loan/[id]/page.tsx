"use client"

import { useToast } from "@/components/ui/use-toast"
import DisplayNetwork from "@/components/ux/display-network"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useConfig } from "wagmi"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import { useEffect, useMemo } from "react"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { machine } from "./loan-machine"
import { useLoanData } from "@/hooks/useLoanData"
import { ZERO_ADDRESS } from "@/services/constants"
import { createActor } from "xstate"
import { useMachine } from "@xstate/react"
/**
 * This page shows the suer the FULL details of the loan
 *
 * Owners/Lenders can claim the debt or retrieve their collateral
 * Borrowers can repay their loan (one or more times if multiple payments are due)
 *
 */
export default function Loan({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const config = useConfig()
  const { toast } = useToast()

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: loan } = useLoanData(id)

  const [loanState, loanSend] = useMachine(machine, {})

  console.log("loan", loan)
  console.log("loanState.value", loanState.value)

  // step one, render all the content (visible by both parties or other users via url params)

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    return [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
  }, [currentChain])

  useEffect(() => {
    // users can change wallets so let's stay on top of that
    if (loan?.collateralOwner === address) {
      loanSend({ type: "is.collateral.owner" })
    } else if (loan?.lenderOwner === address) {
      loanSend({ type: "is.debt.owner" })
    } else {
      loanSend({ type: "is.viewer" })
    }
  }, [address, loan])

  // RENDERING
  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">
          Debita Loan #{Number(id)}
        </h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8"></div>
        <div className="space-y-8 max-w-xl w-full">
          <div></div>
        </div>
      </div>
    </>
  )
}
