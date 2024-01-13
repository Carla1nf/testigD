import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "lendOffer",
    initial: "isNotOwner",
    states: {
      isNotOwner: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "user.has.allowance": {
                target: "canAcceptOffer",
              },
              "user.not.has.allowance": {
                target: "notEnoughAllowance",
              },
            },
          },
          canAcceptOffer: {
            on: {
              "user.accept.offer": {
                target: "acceptingOffer",
              },
            },
          },
          notEnoughAllowance: {
            on: {
              "user.allowance.increase": {
                target: "increaseCollateralAllowance",
              },
            },
          },
          acceptingOffer: {
            invoke: {
              input: {},
              src: "acceptOffer",
              id: "acceptOffer",
              onDone: [
                {
                  target: "offerAccepted",
                },
              ],
              onError: [
                {
                  target: "acceptingOfferError",
                },
              ],
            },
          },
          increaseCollateralAllowance: {
            invoke: {
              input: {},
              src: "increaseCollateralAllowance",
              id: "increaseCollateralAllowance",
              onDone: [
                {
                  target: "canAcceptOffer",
                },
              ],
              onError: [
                {
                  target: "increaseAllowanceError",
                },
              ],
            },
          },
          offerAccepted: {
            type: "final",
          },
          acceptingOfferError: {
            on: {
              "user.accept.offer.retry": {
                target: "acceptingOffer",
              },
            },
          },
          increaseAllowanceError: {
            on: {
              "user.increase.collateral.allowance.retry": {
                target: "increaseCollateralAllowance",
              },
            },
          },
        },
        on: {
          owner: {
            target: "#lendOffer.isOwner.idle",
          },
        },
      },
      isOwner: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "owner.cancel": {
                target: "cancelling",
              },
              "owner.editing": {
                target: "editing",
              },
            },
          },
          cancelling: {
            invoke: {
              input: {},
              src: "cancelOffer",
              onDone: [
                {
                  target: "cancelled",
                },
              ],
              onError: [
                {
                  target: "errorCancellingOffer",
                },
              ],
            },
          },
          editing: {
            on: {
              "owner.cancel": {
                target: "idle",
              },
              "owner.update.offer": {
                target: "checkPrincipleAllowance",
              },
            },
          },
          cancelled: {
            type: "final",
          },
          errorCancellingOffer: {
            on: {
              "owner.retry": {
                target: "cancelling",
              },
            },
          },
          checkPrincipleAllowance: {
            invoke: {
              input: {},
              src: "checkPrincipleAllowance",
              id: "checkPrincipleAllowance",
              onDone: [
                {
                  target: "updatingOffer",
                },
              ],
              onError: [
                {
                  target: "increasePrincipleAllowance",
                },
              ],
            },
          },
          updatingOffer: {
            invoke: {
              input: {},
              src: "updateOffer",
              id: "updateOffer",
              onDone: [
                {
                  target: "idle",
                },
              ],
              onError: [
                {
                  target: "errorUpdatingOffer",
                },
              ],
            },
          },
          increasePrincipleAllowance: {
            invoke: {
              input: {},
              src: "increasePrincipleAllowance",
              id: "increasePrincipleAllowance",
              onDone: [
                {
                  target: "updatingOffer",
                },
              ],
              onError: [
                {
                  target: "errorIncreasingPrincipleAllowance",
                },
              ],
            },
            on: {
              cancel: {
                target: "editing",
              },
            },
          },
          errorUpdatingOffer: {
            on: {
              "owner.update.offer.retry": {
                target: "updatingOffer",
              },
            },
          },
          errorIncreasingPrincipleAllowance: {
            on: {
              "owner.increase.principle.allowance.retry": {
                target: "increasePrincipleAllowance",
              },
              cancel: {
                target: "editing",
              },
            },
          },
        },
        on: {
          "not.owner": {
            target: "#lendOffer.isNotOwner.idle",
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "user.has.allowance" }
        | { type: "user.not.has.allowance" }
        | { type: "user.accept.offer" }
        | { type: "user.allowance.increase" }
        | { type: "user.accept.offer.retry" }
        | { type: "user.increase.collateral.allowance.retry" }
        | { type: "owner" }
        | { type: "owner.cancel" }
        | { type: "owner.editing" }
        | { type: "owner.update.offer" }
        | { type: "owner.retry" }
        | { type: "owner.update.offer.retry" }
        | { type: "owner.increase.principle.allowance.retry" }
        | { type: "not.owner" }
        | { type: "cancel" },
    },
  },
  {
    actions: {},
    actors: {
      acceptOffer: createMachine({
        /* ... */
      }),
      cancelOffer: createMachine({
        /* ... */
      }),
      updateOffer: createMachine({
        /* ... */
      }),
      checkPrincipleAllowance: createMachine({
        /* ... */
      }),
      increasePrincipleAllowance: createMachine({
        /* ... */
      }),
      increaseCollateralAllowance: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  }
)
