import { SpinnerIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import ActionButtons from "@/components/ux/action-buttons"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayToken from "@/components/ux/display-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { fromDecimals } from "@/lib/erc20"
import { pointsBorrow } from "@/lib/getPoints"
import { Token } from "@/lib/tokens"

const NotOwnerErc20Buttons = ({
  state,
  send,
  handleWantedBorrow,
  collateralToken,
  amountCollateral,
  principle,
  borrowAmount,
  pointsToGet,
}: {
  send: any
  state: any
  handleWantedBorrow: any
  collateralToken?: Token
  amountCollateral: number
  principle: any
  borrowAmount: number
  pointsToGet: number
}) => {
  const currentChain = useCurrentChain()
  if (!state.matches("isNotOwner.erc20")) {
    return null
  }

  return (
    <>
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.idle")}>
        <div className="flex gap-10 items-center">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center italic opacity-80">
              <div className=" text-sm"> Collateral required:</div>
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
            <div>
              <label htmlFor="customRange1" className="inline-block text-neutral-700 dark:text-neutral-200"></label>
              <input
                type="range"
                min={1}
                max={100}
                defaultValue={0}
                className="transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
                id="customRange1"
                onChange={(e) => {
                  handleWantedBorrow(Number(e.currentTarget.value))
                }}
              />
            </div>
            <div className="flex gap-3">
              <div>Borrow amount:</div>
              <DisplayToken token={principle ? principle.token : ""} amount={borrowAmount} size={20} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant={"action"}
              className="px-16"
              onClick={async () => {
                send({ type: "user.accept.offer" })
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </ShowWhenTrue>
      <ShowWhenTrue when={state.matches("isNotOwner.erc20.notEnoughAllowance")}>
        <div className="flex justify-between">
          <div className="text-gray-400 text-sm py-2 px-7 text-center items-center h-full">
            You will get{" "}
            <span className="text-white font-bold">
              {pointsBorrow({
                totalPointsAvailable: Number(pointsToGet),
                amountToBorrow: borrowAmount,
                totalPrincipleAmount: principle?.amount ?? 1,
              })}
              DBT
            </span>{" "}
            Points
          </div>
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
        </div>
      </ShowWhenTrue>

      <div>
        <ActionButtons.Group
          when={state.matches("isNotOwner.erc20.increaseCollateralAllowance")}
          left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "user.cancel" })} />}
          right={<ActionButtons.Spinner title="Accepting Offer.." when={true} />}
        />
      </div>
      {/* INCRESING ALLOWANCE */}

      <ActionButtons.Group
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "user.cancel" })} />}
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
        </div>
      </ShowWhenTrue>

      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.acceptingOffer")}
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "user.cancel" })} />}
        right={<ActionButtons.Spinner title="Accepting Offer..." when={true} />}
      />

      <ActionButtons.Group
        when={state.matches("isNotOwner.erc20.acceptingOfferError")}
        left={<ActionButtons.Cancel when={true} onClick={() => send({ type: "user.cancel" })} />}
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
