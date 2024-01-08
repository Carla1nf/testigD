import { createMachine } from "xstate"

export const borrowOfferMachine = createMachine(
  {
    id: "borrowOffer",
    initial: "isNotOwner",
    states: {
      isNotOwner: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "user.has.allowance": { target: "canAcceptOffer" },
              "user.not.has.allowance": { target: "notEnoughAllowance" },
            },
          },
          notEnoughAllowance: {
            on: {
              "user.allowance.increase": { target: "increaseAllowance" },
            },
          },
          increaseAllowance: {
            invoke: {
              src: "increaseAllowance",
              onDone: { target: "canAcceptOffer", actions: "userIncreasedAllowance" },
              onError: { target: "increaseAllowanceError" },
            },
          },
          increaseAllowanceError: {
            on: {
              "user.allowance.increase.retry": { target: "increaseAllowance" },
            },
          },
          canAcceptOffer: {
            on: {
              "user.accept.offer": { target: "acceptingOffer" },
            },
          },
          acceptingOffer: {
            invoke: {
              src: "acceptOffer",
              onDone: { target: "offerAccepted", actions: "userAcceptedOffer" },
              onError: { target: "acceptingOfferError" },
            },
          },
          acceptingOfferError: {
            on: {
              "user.accept.offer.retry": { target: "acceptingOffer" },
            },
          },
          offerAccepted: { type: "final" },
        },
        on: {
          owner: { target: "isOwner.idle" },
        },
      },
      isOwner: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "owner.cancel": { target: "cancelling" },
            },
          },
          cancelling: {
            invoke: {
              src: "cancelBorrowOffer",
              onDone: { target: "cancelled", actions: "ownerCancelledOffer" },
              onError: { target: "error" },
            },
          },
          cancelled: { type: "final" },
          error: {
            on: {
              "owner.retry": { target: "cancelling" },
            },
          },
        },
        on: {
          "not.owner": { target: "isNotOwner.idle" },
        },
      },
    },
    types: {
      actions: {} as {
        type: string
        ownerCancelledOffer: ({ input }: { input: any }) => void
        userIncreasedAllowance: ({ input }: { input: any }) => void
        userAcceptedOffer: ({ input }: { input: any }) => void
      },
      events: {} as
        | { type: "owner" }
        | { type: "not.owner" }
        | { type: "owner.cancel" }
        | { type: "owner.retry" }
        | { type: "user.has.allowance" }
        | { type: "user.not.has.allowance" }
        | { type: "user.allowance.increase" }
        | { type: "user.allowance.increase.retry" }
        | { type: "user.accept.offer" }
        | { type: "user.accept.offer.retry" },
    },
  },
  {
    actions: {},
    actors: {},
    delays: {},
    guards: {},
  }
)
