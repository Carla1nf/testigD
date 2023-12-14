import { Token, tokenSchema } from "@/lib/tokens"
import { assign, createMachine } from "xstate"

const parseToken = (values: any) => {
  try {
    return tokenSchema.parse(values)
  } catch (error) {
    return undefined
  }
}

export const machine = createMachine(
  {
    id: "createOffer",
    initial: "form",
    context: {
      collateralToken1: undefined,
      collateralValue1: undefined,
      collateralToken2: undefined,
      collateralValue2: undefined,
      token: undefined,
      tokenValue: undefined,
      durationDays: undefined,
      interestPercent: undefined,
      numberOfPayments: undefined,
    },
    states: {
      form: {
        description: "Form can be filled out in any order",
        states: {
          collateralToken1: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralToken1: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setCollateralToken1", "updateLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken1: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setCollateralToken1", "updateLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
            },
          },
          token: {
            description:
              "- When creating a lend offer, the token is the lending token\n- When creating a borrow offer, the token is the wanted borrow token",
            initial: "idle",
            states: {
              idle: {
                on: {
                  token: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setToken", "updateLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  token: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setToken", "updateLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
            },
          },
          numberOfPayments: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  numberOfPayments: {
                    target: "hasValue",
                    guard: "isValidNumberOfPayments",
                    actions: ["setNumberOfPayments", "validateForm"],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
              hasValue: {
                on: {
                  numberOfPayments: {
                    target: "hasValue",
                    guard: "isValidNumberOfPayments",
                    actions: ["setNumberOfPayments", "validateForm"],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
            },
          },
          history: {},
          collateralToken0: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralToken0: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setCollateralToken0", "updateLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken0: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setCollateralToken0", "updateLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
            },
          },
          collateralValue0: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralValue0: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue0", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralValue0: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue0", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
          collateralValue1: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralValue1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue1", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralValue1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue1", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
          tokenValue: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  tokenValue: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setTokenValue", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  tokenValue: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setTokenValue", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
          durationDays: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  durationDays: {
                    target: "hasValue",
                    guard: "isValidDurationDays",
                    actions: ["setDurationDays", "validateForm"],
                    description: "Must be an integer between 0 and 365",
                  },
                },
              },
              hasValue: {
                on: {
                  durationDays: {
                    target: "hasValue",
                    guard: "isValidDurationDays",
                    actions: ["setDurationDays", "validateForm"],
                    description: "Must be an integer between 0 and 365",
                  },
                },
              },
            },
          },
          interestPercent: {
            description: "Defaults to 0 which is an allowed value",
            initial: "hasValue",
            states: {
              hasValue: {
                on: {
                  interestPercent: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setInterestPercent", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
        },
        on: {
          next: {
            target: "confirmation",
            guard: "isFormComplete",
            description: "Denies access to the confirmation screen if form not complete",
          },
        },
        type: "parallel",
      },
      confirmation: {
        on: {
          confirm: {
            target: "creating",
          },
          back: {
            target: "#createOffer.form.history",
          },
        },
      },
      creating: {
        invoke: {
          src: "createOffer",
          id: "createOffer",
          onDone: [{ target: "created" }],
          onError: [{ target: "error" }],
        },
      },
      created: {},
      error: {
        on: {
          retry: { target: "creating" },
        },
      },
    },
    types: {} as {
      context: {
        collateralToken1: Token | undefined
        collateralValue1: number | undefined
        collateralToken2: Token | undefined
        collateralValue2: number | undefined
        token: Token | undefined
        tokenValue: number | undefined
        durationDays: number | undefined
        interestPercent: number | undefined
        numberOfPayments: number | undefined
      }
      events:
        | { type: "back" }
        | { type: "next" }
        | { type: "retry" }
        | { type: "confirm" }
        | { type: "token"; value: Token }
        | { type: "tokenValue"; value: number }
        | { type: "durationDays"; value: number }
        | { type: "interestPercent"; value: number }
        | { type: "collateralToken0"; value: Token }
        | { type: "collateralValue0"; value: number }
        | { type: "collateralToken1"; value: Token }
        | { type: "collateralValue1"; value: number }
        | { type: "numberOfPayments"; value: number }
    },
  },
  {
    actions: {
      setCollateralToken1: ({ context, event }) => {
        if ("value" in event) {
          try {
            const parsed = tokenSchema.parse(event.value)
            context.collateralToken1 = parsed
          } catch (error) {
            console.log("setCollateralToken1->error", error)
          }
        }
      },
      updateLTV: ({ context, event }) => {},
      updateChartValues: ({ context, event }) => {},
      setCollateralToken0: assign({
        token: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setCollateralValue0: ({ context, event }) => {},
      setCollateralToken1: assign({
        token: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setCollateralValue1: ({ context, event }) => {},
      setToken: assign({
        token: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setTokenValue: ({ context, event }) => {},
      setNumberOfPayments: ({ context, event }) => {},
      validateForm: ({ context, event }) => {},
      setDurationDays: ({ context, event }) => {},
      setInterestPercent: ({ context, event }) => {},
    },
    actors: {
      createOffer: createMachine({
        /* ... */
      }),
    },
    guards: {
      isFormComplete: ({ context, event }, params) => {
        return false
      },
      isValidToken: ({ context, event }, params) => {
        if ("value" in event) {
          return Boolean(parseToken(event.value))
        }
        return false
      },
      isNonNegativeInteger: ({ context, event }, params) => {
        if ("value" in event) {
          return Number.isInteger(event.value) && Number(event.value) >= 0
        }
        return false
      },
      isValidNumberOfPayments: ({ context, event }, params) => {
        if ("value" in event) {
          return Number.isInteger(event.value) && Number(event.value) >= 0 && Number(event.value) <= 10
        }
        return false
      },
      isValidDurationDays: ({ context, event }, params) => {
        if ("value" in event) {
          return Number.isInteger(event.value) && Number(event.value) >= 0 && Number(event.value) <= 365
        }
        return false
      },
    },
    delays: {},
  }
)
