import ActionButtons from "@/components/ux/action-buttons"

const OwnerEditingButtons = ({ state, send }: { send: any; state: any }) => {
  if (!state.matches("isOwner.editing")) {
    return null
  }

  return (
    <>
      <ActionButtons.Group
        when={state.matches("isOwner.editing.idle")}
        right={
          <ActionButtons.Action
            title="Update Offer"
            when={true}
            onClick={() => {
              send({ type: "owner.update.offer" })
            }}
          />
        }
        className="w-full"
      />

      <ActionButtons.Group
        when={state.matches("isOwner.editing.offerUpdated")}
        right={
          <ActionButtons.Success
            title="Offer Updated"
            when={true}
            onClick={() => {
              send({ type: "owner.update.offer" })
            }}
          />
        }
        className="w-full"
      />

      <ActionButtons.Group
        when={state.matches("isOwner.editing.checkPrincipleAllowance")}
        right={<ActionButtons.Action title="Update Offer" onClick={() => {}} when={true} />}
        className="w-full"
      />

      <ActionButtons.Group
        when={state.matches("isOwner.editing.increasePrincipleAllowance")}
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "owner.cancel.editing" })} />}
        right={<ActionButtons.Spinner title="Increase Allowance" when={true} />}
        className="w-full"
      />

      <ActionButtons.Group
        when={state.matches("isOwner.editing.errorIncreasingPrincipleAllowance")}
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "owner.cancel.editing" })} />}
        right={
          <ActionButtons.Error
            title="Increase Allowance Failed - Retry?"
            when={true}
            onClick={() => {
              send({ type: "owner.increase.principle.allowance.retry" })
            }}
          />
        }
        className="w-full"
      />

      <ActionButtons.Group
        when={state.matches("isOwner.editing.updatingOffer")}
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "owner.cancel.editing" })} />}
        right={<ActionButtons.Spinner title="Updating Offer" when={true} />}
        className="w-full"
      />

      <ActionButtons.Group
        when={state.matches("isOwner.editing.errorUpdatingOffer")}
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "owner.cancel.editing" })} />}
        right={
          <ActionButtons.Error
            title="Updating Offer Failed - Retry?"
            when={true}
            onClick={() => {
              send({ type: "owner.update.offer.retry" })
            }}
          />
        }
        className="w-full"
      />
    </>
  )
}

export default OwnerEditingButtons
