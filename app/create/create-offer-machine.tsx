import { Token, tokenSchema } from "@/lib/tokens"
import { createMachine } from "xstate"

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
                    actions: [
                      { type: "setCollateralToken1" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken1: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: [
                      { type: "setCollateralToken1" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
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
                    actions: [
                      { type: "setToken" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  token: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: [
                      { type: "setToken" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
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
                    actions: [{ type: "setNumberOfPayments" }, { type: "validateForm" }],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
              hasValue: {
                on: {
                  numberOfPayments: {
                    target: "hasValue",
                    guard: "isValidNumberOfPayments",
                    actions: [{ type: "setNumberOfPayments" }, { type: "validateForm" }],
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
                    actions: [
                      { type: "setCollateralToken0" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken0: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: [
                      { type: "setCollateralToken0" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
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
                    actions: [{ type: "setCollateralValue0" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralValue0: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setCollateralValue0" }, { type: "updateLTV" }, { type: "validateForm" }],
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
                    actions: [{ type: "setCollateralValue1" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralValue1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setCollateralValue1" }, { type: "updateLTV" }, { type: "validateForm" }],
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
                    actions: [{ type: "setTokenValue" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  tokenValue: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setTokenValue" }, { type: "updateLTV" }, { type: "validateForm" }],
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
                    actions: [{ type: "setDurationDays" }, { type: "validateForm" }],
                    description: "Must be an integer between 0 and 365",
                  },
                },
              },
              hasValue: {
                on: {
                  durationDays: {
                    target: "hasValue",
                    guard: "isValidDurationDays",
                    actions: [{ type: "setDurationDays" }, { type: "validateForm" }],
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
                    actions: [{ type: "setInterestPercent" }, { type: "validateForm" }],
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
      setToken: ({ context, event }) => {},
      setCollateralToken0: ({ context, event }) => {},
      setCollateralValue0: ({ context, event }) => {},
      setCollateralValue1: ({ context, event }) => {},
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
          try {
            const parsed = tokenSchema.parse(event.value)
            console.log("isValidToken->parsed", parsed)
            return true
          } catch (error) {}
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
