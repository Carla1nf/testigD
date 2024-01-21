import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayToken from "@/components/ux/display-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token } from "@/lib/tokens"
import { CheckCircle, XCircle } from "lucide-react"

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
      {/* Show the Increase Allowance button when the user doesn't not have enough allowance */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.notEnoughAllowance")}>
        <Button
          variant={"action"}
          className="px-16"
          onClick={async () => {
            send({ type: "user.allowance.increase" })
          }}
        >
          Accept Offer
        </Button>
      </ShowWhenTrue>

      {/* Show the Increasing Allowance spinner button while performing an increase allowance transaction */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.increaseAllowance")}>
        <Button variant={"action"} className="px-16">
          Increasing Allowance
          <SpinnerIcon className="ml-2 animate-spin-slow" />
        </Button>
      </ShowWhenTrue>

      {/* Increasing Allowance Failed - Allow the user to try increasing allowance again */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.increaseAllowanceError")}>
        <Button
          variant="error"
          className="h-full w-full gap-2"
          onClick={() => {
            send({ type: "user.increase.collateral.allowance.retry" })
          }}
        >
          <XCircle className="h-5 w-5" />
          Increasing Allowance Failed - Retry?
        </Button>
      </ShowWhenTrue>

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

      {/* Accepted offer failed - Allow the user tor try accepting the offer again */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.acceptingOfferError")}>
        <Button
          variant="error"
          className="h-full w-full gap-2"
          onClick={() => {
            send({ type: "user.accept.offer.retry" })
          }}
        >
          <XCircle className="h-5 w-5" />
          Accept Offer Failed - Retry?
        </Button>
      </ShowWhenTrue>

      {/* The offer is accepted */}
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.offerAccepted")}>
        <Button variant={"success"} className="px-16 gap-2">
          <CheckCircle className="w-5 h-5" />
          Offer Accepted
        </Button>
      </ShowWhenTrue>
    </>
  )
}

export default NotOwnerErc20Buttons
