import { createMachine, fromPromise } from "xstate"

export const ownerCancelBorrowOfferMachine = createMachine(
  {
    id: "OwnerCancelBorrowOffer",
    initial: "isNotOwner",
    states: {
      isNotOwner: {
        on: {
          owner: {
            target: "isOwner",
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
            },
          },
          cancelling: {
            invoke: {
              src: "cancelBorrowOffer",
              onDone: [
                {
                  target: "cancelled",
                },
              ],
              onError: [
                {
                  target: "error",
                },
              ],
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
      },
    },
    types: {
      events: {} as { type: "owner" } | { type: "owner.cancel" } | { type: "owner.retry" },
    },
  },
  {
    actions: {},
    actors: {},
    delays: {},
    guards: {},
  }
)
