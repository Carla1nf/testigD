import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import ActionButtons from "@/components/ux/action-buttons"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayToken from "@/components/ux/display-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token } from "@/lib/tokens"

const NotOwnerErc20Buttons = ({
  state,
  send,
  handleWantedBorrow,
  collateralToken,
  amountCollateral,
  principle,
}: {
  send: any
  state: any
  handleWantedBorrow: any
  collateralToken?: Token
  amountCollateral: number
  principle: any
}) => {
  const currentChain = useCurrentChain()
  if (!state.matches("isNotOwner.erc20")) {
    return null
  }

  return (
    <>
      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.idle")}
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
        when={state.matches("isNotOwner.erc20.notEnoughAllowance")}
        right={
          <ActionButtons.Action
            title="Accept Offer"
            when={true}
            onClick={async () => {
              send({ type: "user.allowance.increase" })
            }}
          />
        }
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.increaseCollateralAllowance")}
        right={<ActionButtons.Spinner title="Increasing Allowance" when={true} />}
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.increaseAllowanceError")}
        right={
          <ActionButtons.Error
            title="Increasing Allowance Failed - Retry?"
            when={true}
            onClick={() => {
              send({ type: "user.increase.collateral.allowance.retry" })
            }}
          />
        }
      />

      {/* User has enough allowance, show them the accept offer button */}
      {/* This shouldn't really be in the buttons, we should extract to a different component and display in the form section */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.canAcceptOffer")}>
        <div className="flex gap-10 items-center justify-center">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center italic opacity-80">
              <div className=" text-sm"> Collateral:</div>
              {collateralToken ? (
                <DisplayToken
                  size={20}
                  token={collateralToken}
                  amount={amountCollateral}
                  className="text-base"
                  chainSlug={currentChain.slug}
                />
              ) : (
                ""
              )}
            </div>
            <input
              className="text-center rounded-lg text-sm px-4 py-2 bg-[#21232B]/40 border-2 border-white/10"
              placeholder={`Amount of ${principle?.token?.symbol}`}
              type="number"
              max={principle ? principle.amount : 0}
              onChange={(e) => {
                principle
                  ? Number(e.currentTarget.value) > principle.amount
                    ? (e.currentTarget.value = String(principle.amount))
                    : ""
                  : ""
                handleWantedBorrow(Number(e.currentTarget.value))
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="opacity-0">holaa</div>
            <Button
              variant={"action"}
              className="px-16"
              onClick={async () => {
                send({ type: "user.accept.offer" })
              }}
            >
              Accept Offer
            </Button>
          </div>
        </div>
      </ShowWhenTrue>

      {/* Show the Accepting Offer spinner while we are accepting the offer */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.acceptingOffer")}>
        <Button variant={"action"} className="px-16">
          Accepting Offer...
          <SpinnerIcon className="ml-2 animate-spin-slow" />
        </Button>
      </ShowWhenTrue>

      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.acceptingOfferError")}
        right={
          <ActionButtons.Error
            title="Accept Offer Failed - Retry?"
            when={true}
            onClick={() => {
              send({ type: "user.accept.offer.retry" })
            }}
          />
        }
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.offerAccepted")}
        right={<ActionButtons.Success title="Offer Accepted" when={true} />}
      />
    </>
  )
}

export default NotOwnerErc20Buttons
