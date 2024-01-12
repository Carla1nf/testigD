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
                target: "increaseAllowance",
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
          increaseAllowance: {
            invoke: {
              input: {},
              src: "increaseAllowance",
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
                target: "increaseAllowance",
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
                  target: "error",
                },
              ],
            },
          },
          editing: {
            on: {
              "owner.cancel": {
                target: "idle",
              },
            },
          },
          cancelled: {
            type: "final",
          },
          error: {
            on: {
              "owner.retry": {
                target: "cancelling",
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
        | { type: "owner.editing" },
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
    },
    guards: {},
    delays: {},
  }
)
