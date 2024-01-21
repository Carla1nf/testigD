import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { XCircle } from "lucide-react"
import ActionButtons from "@/components/ux/action-buttons"

const OwnerEditingButtons = ({ state, send }: { send: any; state: any }) => {
  if (!state.matches("isOwner.editing")) {
    return null
  }

  return (
    <>
      <ActionButtons.Action
        title="Update Offer"
        when={state.matches("isOwner.editing.idle")}
        onClick={() => {
          send({ type: "owner.update.offer" })
        }}
      />
      <ActionButtons.Action
        title="Update Offer"
        when={state.matches("isOwner.editing.checkPrincipleAllowance")}
        onClick={() => {}}
      />
      <ShowWhenTrue when={state.matches("isOwner.editing.increasePrincipleAllowance")}>
        <div className="flex justify-between w-full">
          <ActionButtons.Cancel when={true} onClick={send({ type: "cancel" })} />
          <ActionButtons.Spinner title="Increase Allowance" when={true} />
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.errorIncreasingPrincipleAllowance")}>
        <div className="flex justify-between w-full">
          <ActionButtons.Cancel when={true} onClick={send({ type: "cancel" })} />
          <ActionButtons.Error
            title="Increase Allowance Failed - Retry?"
            when={true}
            onClick={() => {
              send({ type: "owner.increase.principle.allowance.retry" })
            }}
          />
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.updatingOffer")}>
        <div className="flex justify-between w-full">
          <ActionButtons.Cancel when={true} onClick={send({ type: "cancel" })} />
          <ActionButtons.Spinner title="Updating Offer" when={true} />
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isOwner.editing.errorUpdatingOffer")}>
        <div className="flex justify-between w-full">
          <ActionButtons.Cancel when={true} onClick={send({ type: "cancel" })} />
          <ActionButtons.Error
            title=" Updating Offer Failed - Retry?"
            when={true}
            onClick={() => {
              send({ type: "owner.update.offer.retry" })
            }}
          />
        </div>
      </ShowWhenTrue>
    </>
  )
}

export default OwnerEditingButtons
