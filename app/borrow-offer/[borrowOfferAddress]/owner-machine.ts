import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "borrowOfferOwner",
    initial: "idle",
    states: {
      idle: {
        on: {
          cancel: {
            target: "cancelling",
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
          retry: {
            target: "cancelling",
          },
        },
      },
    },
    types: { events: {} as { type: "cancel" } | { type: "retry" } },
  },
  {
    actions: {},
    actors: {},
    guards: {},
    delays: {},
  }
)
