import { PersonIcon, SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { XCircle, CheckCircle } from "lucide-react"

import { send } from "process"

const OwnerCancelButtons = ({ state, send }: { state: any; send: any }) => {
  const canShowCancelOfferButton =
    state.matches("isOwner.idle") ||
    state.matches("isOwner.editing") ||
    state.matches("isOwner.checkPrincipleAllowance") ||
    state.matches("isOwner.increasePrincipleAllowance") ||
    state.matches("isOwner.errorIncreasingPrincipleAllowance")

  return (
    <ShowWhenTrue when={state.matches("isOwner")}>
      <div className="grid grid-cols-2 justify-between gap-8">
        <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
          You are the Owner
          <PersonIcon className="w-6 h-6" />
          {/* {shortAddress(collateralData?.owner)} */}
        </div>
        <div>
          {/* Cancel the offer */}
          <ShowWhenTrue when={canShowCancelOfferButton}>
            <Button
              variant="action"
              className="h-full w-full"
              onClick={() => {
                send({ type: "owner.cancel" })
              }}
            >
              Cancel Offer
            </Button>
          </ShowWhenTrue>
          <ShowWhenTrue when={state.matches("isOwner.errorCancellingOffer")}>
            <Button
              variant="error"
              className="h-full w-full gap-2"
              onClick={() => {
                send({ type: "owner.retry" })
              }}
            >
              <XCircle className="h-5 w-5" /> Cancel Failed - Retry?
            </Button>
          </ShowWhenTrue>

          {/* Cancelling the offer */}
          <ShowWhenTrue when={state.matches("isOwner.cancelling")}>
            <Button variant="action" className="h-full w-full">
              Cancelling
              <SpinnerIcon className="ml-2 animate-spin-slow" />
            </Button>
          </ShowWhenTrue>

          {/* Offer cancelled */}
          <ShowWhenTrue when={state.matches("isOwner.cancelled")}>
            <div className="h-full w-full inline-flex bg-success text-white gap-2 items-center justify-center border border-white/25 rounded-md">
              <CheckCircle className="w-5 h-5" /> Cancelled
            </div>
          </ShowWhenTrue>
        </div>
      </div>
    </ShowWhenTrue>
  )
}

export default OwnerCancelButtons
