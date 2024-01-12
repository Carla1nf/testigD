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
                target: "userIncreaseAllowance",
              },
            },
          },
          acceptingOffer: {
            invoke: {
              input: {},
              src: "acceptOffer",
              onDone: [
                {
                  target: "offerAccepted",
                  actions: {
                    type: "userAcceptedOffer",
                  },
                },
              ],
              onError: [
                {
                  target: "acceptingOfferError",
                },
              ],
            },
          },
          userIncreaseAllowance: {
            invoke: {
              input: {},
              src: "userIncreaseAllowance",
              id: "userIncreaseAllowance",
              onDone: [
                {
                  target: "canAcceptOffer",
                  actions: {
                    type: "userIncreasedAllowance",
                  },
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
              "user.allowance.increase.retry": {
                target: "userIncreaseAllowance",
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
                  actions: {
                    type: "ownerCancelledOffer",
                  },
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
                target: "checkAllowance",
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
          checkAllowance: {
            invoke: {
              src: "checkAllowance",
              input: {},
              onDone: [
                {
                  target: "updatingOffer",
                },
              ],
              onError: [
                {
                  target: "increaseAllowance",
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
          increaseAllowance: {
            invoke: {
              input: {},
              src: "ownerIncreaseAllowance",
              id: "ownerIncreaseAllowance",
              onError: [
                {
                  target: "increaseAllowanceError",
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
          increaseAllowanceError: {
            on: {
              "owner.allowance.increase.retry": {
                target: "increaseAllowance",
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
        | { type: "user.allowance.increase.retry" }
        | { type: "user.accept.offer" }
        | { type: "user.accept.offer.retry" }
        | { type: "owner" }
        | { type: "owner.cancel" }
        | { type: "owner.retry" }
        | { type: "not.owner" }
        | { type: "owner.editing" }
        | { type: "owner.update.offer" }
        | { type: "owner.allowance.increase.retry" }
        | { type: "owner.update.offer.retry" },
    },
  },
  {
    actions: {
      userIncreasedAllowance: ({ context, event }) => {},
      userAcceptedOffer: ({ context, event }) => {},
      ownerCancelledOffer: ({ context, event }) => {},
    },
    actors: {
      increaseAllowance: createMachine({
        /* ... */
      }),
      acceptOffer: createMachine({
        /* ... */
      }),
      cancelOffer: createMachine({
        /* ... */
      }),
      checkAllowance: createMachine({
        /* ... */
      }),
      updateOffer: createMachine({
        /* ... */
      }),
      userIncreaseAllowance: createMachine({
        /* ... */
      }),
      ownerIncreaseAllowance: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  }
)
