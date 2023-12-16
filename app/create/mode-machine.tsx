import { createMachine } from "xstate"

export const modeMachine = createMachine({
  id: "mode",
  initial: "borrow",
  types: {} as {
    events: { type: "mode" }
  },
  states: {
    borrow: {
      on: {
        mode: {
          target: "lend",
        },
      },
    },
    lend: {
      on: {
        mode: {
          target: "borrow",
        },
      },
    },
  },
})
