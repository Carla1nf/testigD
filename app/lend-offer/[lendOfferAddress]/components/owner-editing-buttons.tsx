import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { XCircle } from "lucide-react"

const OwnerEditingButtons = ({ state, send }: { send: any; state: any }) => {
  if (!state.matches("isOwner.editing")) {
    return null
  }
  return (
    <>
      <ShowWhenTrue when={state.matches("isOwner.editing.checkPrincipleAllowance")}>
        <Button variant="action" className="h-full w-1/2">
          Update Offer
        </Button>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.increasePrincipleAllowance")}>
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            className=""
            onClick={() => {
              send({ type: "cancel" })
            }}
          >
            Cancel
          </Button>
          <Button variant="action" className="h-full w-1/2">
            Increase Allowance
            <SpinnerIcon className="ml-2 animate-spin-slow" />
          </Button>
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.errorIncreasingPrincipleAllowance")}>
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            className=""
            onClick={() => {
              send({ type: "cancel" })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            className="px-12 gap-2"
            onClick={() => {
              send({ type: "owner.increase.principle.allowance.retry" })
            }}
          >
            <XCircle className="h-5 w-5" />
            Increase Allowance Failed - Retry?
          </Button>
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.updatingOffer")}>
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            className=""
            onClick={() => {
              send({ type: "cancel" })
            }}
          >
            Cancel
          </Button>
          <Button variant="action" className="h-full px-8">
            Updating Offer
            <SpinnerIcon className="ml-2 animate-spin-slow" />
          </Button>
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.errorUpdatingOffer")}>
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            className=""
            onClick={() => {
              send({ type: "cancel" })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            className="px-12 gap-2"
            onClick={() => {
              send({ type: "owner.update.offer.retry" })
            }}
          >
            <XCircle className="h-5 w-5" />
            Updating Offer Failed - Retry?
          </Button>
        </div>
      </ShowWhenTrue>
    </>
  )
}

export default OwnerEditingButtons
