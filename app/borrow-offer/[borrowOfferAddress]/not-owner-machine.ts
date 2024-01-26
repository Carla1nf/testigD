import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "notOwner",
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
    types: {
      events: {} as
        | { type: "user.has.allowance" }
        | { type: "user.not.has.allowance" }
        | { type: "user.allowance.increase" }
        | { type: "user.allowance.increase.retry" }
        | { type: "user.accept.offer" }
        | { type: "user.accept.offer.retry" },
    },
  },
  {
    actions: {
      userIncreasedAllowance: ({ context, event }) => {},
      userAcceptedOffer: ({ context, event }) => {},
    },
    actors: {},
    guards: {},
    delays: {},
  }
)
