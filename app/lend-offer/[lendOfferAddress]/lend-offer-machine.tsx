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
              src: "checkPrincipleAllowance",
              id: "checkPrincipleAllowance",
              input: {},
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
              src: "updateOffer",
              id: "updateOffer",
              input: {},
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
              onError: [
                {
                  target: "increasePrincipleAllowanceError",
                },
              ],
              onDone: [
                {
                  target: "updatingOffer",
                },
              ],
            },
          },
          errorUpdatingOffer: {
            on: {
              "owner.update.offer.retry": {
                target: "updatingOffer",
              },
            },
          },
          increasePrincipleAllowanceError: {
            on: {
              "owner.increase.principle.allowance.retry": {
                target: "increasePrincipleAllowance",
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
        | { type: "user.allowance.increase" }
        | { type: "user.accept.offer" }
        | { type: "user.accept.offer.retry" }
        | { type: "owner" }
        | { type: "owner.cancel" }
        | { type: "owner.retry" }
        | { type: "not.owner" }
        | { type: "owner.editing" }
        | { type: "owner.update.offer" }
        | { type: "owner.update.offer.retry" }
        | { type: "owner.increase.principle.allowance.retry" }
        | { type: "user.increase.collateral.allowance.retry" },
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
