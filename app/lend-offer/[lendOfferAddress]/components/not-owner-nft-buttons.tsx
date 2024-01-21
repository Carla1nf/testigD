import ActionButtons from "@/components/ux/action-buttons"

const noop = () => {}
const NotOwnerNftButtons = ({ state, send }: { send: any; state: any }) => {
  if (!state.matches("isNotOwner.nft")) {
    return null
  }
  return (
    <>
      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.idle")}
        right={
          <ActionButtons.Action
            title="Accept Offer"
            when={true}
            onClick={async () => {
              send({ type: "user.accept.offer" })
            }}
          />
        }
      />
      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.checkNftAllowance")}
        right={<ActionButtons.Action onClick={noop} title="Approve NFT" when={true} />}
      />
      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.nftNeedsApproval")}
        right={
          <ActionButtons.Action
            title="Approve NFT"
            when={true}
            onClick={async () => {
              send({ type: "user.approve.nft" })
            }}
          />
        }
      />
      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.approveNft")}
        left={<ActionButtons.Cancel onClick={() => send({ type: "user.nft.cancel" })} title="Cancel" when={true} />}
        right={<ActionButtons.Spinner onClick={noop} title="Approve NFT" when={true} />}
      />
      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.approveNftError")}
        left={<ActionButtons.Cancel onClick={() => send({ type: "user.nft.cancel" })} title="Cancel" when={true} />}
        right={
          <ActionButtons.Error
            onClick={() => send({ type: "user.approve.nft.retry" })}
            title="Approving Nft Failed - Retry?"
            when={true}
          />
        }
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.acceptingOffer")}
        left={<ActionButtons.Cancel onClick={() => send({ type: "user.nft.cancel" })} title="Cancel" when={true} />}
        right={<ActionButtons.Spinner onClick={noop} title="Accepting Offer" when={true} />}
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.acceptingOfferError")}
        left={<ActionButtons.Cancel onClick={() => send({ type: "user.nft.cancel" })} title="Cancel" when={true} />}
        right={
          <ActionButtons.Error
            onClick={() => send({ type: "user.accept.offer.retry" })}
            title="Accepting Offer Failed - Retry?"
            when={true}
          />
        }
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.nft.nftSelected.offerAccepted")}
        right={<ActionButtons.Success onClick={noop} title="Offer Accepted" when={true} />}
      />
    </>
  )
}

export default NotOwnerNftButtons
