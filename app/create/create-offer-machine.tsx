import { Token, tokenSchema } from "@/lib/tokens"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { assign, createMachine, fromPromise } from "xstate"

const parseToken = (values: any) => {
  try {
    return tokenSchema.parse(values)
  } catch (error) {
    return undefined
  }
}

export type Ltv = "25" | "50" | "75" | "Custom"

export const machine = createMachine(
  {
    id: "createOffer",
    initial: "form",
    context: ({ input }: { input: any }) => {
      console.log("input", input)
      return {
        collateralToken0: input?.collateralToken0 ?? undefined,
        collateralValue0: undefined,
        collateralToken1: input?.collateralToken1 ?? undefined,
        collateralValue1: undefined,
        token: input?.token ?? undefined,
        tokenValue: undefined,
        durationDays: undefined,
        interestPercent: undefined,
        numberOfPayments: undefined,
        ltvValue: undefined,
        ltv: undefined,
      }
    },
    states: {
      form: {
        description: "Form can be filled out in any order",
        states: {
          collateralToken0: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralToken0: {
                    target: "selecting",
                    guard: "isValidToken",
                    actions: ["setCollateralToken0"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selecting: {
                invoke: {
                  src: "fetchTokenPrice",
                  onDone: {
                    target: "selected",
                    actions: "setCollateralTokenPrice0",
                  },
                  onError: {
                    target: "selected",
                    actions: "clearCollateralTokenPrice0",
                  },
                },
              },
              selected: {
                entry: ["updateLTV", "updateChartValues", "validateForm"],
                on: {
                  collateralToken0: {
                    target: "selecting",
                    guard: "isValidToken",
                    actions: ["setCollateralToken0"],
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
          history: {},
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
        collateralToken0: Token | undefined
        collateralValue0: number | undefined
        collateralToken1: Token | undefined
        collateralValue1: number | undefined
        token: Token | undefined
        tokenValue: number | undefined
        durationDays: number | undefined
        interestPercent: number | undefined
        numberOfPayments: number | undefined
        ltvValue: number | undefined
        ltv: Ltv | undefined
      }
      events:
        | { type: "back" }
        | { type: "next" }
        | { type: "retry" }
        | { type: "confirm" }
        | { type: "token"; value: Token }
        | { type: "tokenValue"; value: number }
        | { type: "collateralToken0"; value: Token }
        | { type: "collateralValue0"; value: number }
        | { type: "collateralToken1"; value: Token }
        | { type: "collateralValue1"; value: number }
        | { type: "durationDays"; value: number }
        | { type: "interestPercent"; value: number }
        | { type: "numberOfPayments"; value: number }
    },
  },
  {
    actions: {
      updateLTV: ({ context, event }) => {
        console.log("context", context)

        // we need both tokens and values
        if (context.collateralToken0 && context.collateralValue0 && context.token && context.tokenValue) {
          // calculate the LTV
          const collateralValue = context.collateralValue0 * context.collateralToken0.price
          const tokenValue = context.tokenValue * context.token.price
          const ltvValue = (collateralValue / tokenValue) * 100
          console.log("ltvValue", collateralValue, tokenValue, ltvValue)
        }
      },
      updateChartValues: ({ context, event }) => {},
      setCollateralToken0: assign({
        token: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setCollateralValue0: assign({
        collateralValue0: ({ event }) => {
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      setCollateralToken1: assign({
        token: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setCollateralValue1: assign({
        collateralValue1: ({ event }) => {
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      setToken: assign({
        token: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setTokenValue: assign({
        tokenValue: ({ event }) => {
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      setNumberOfPayments: ({ context, event }) => {},
      validateForm: ({ context, event }) => {},
      setDurationDays: ({ context, event }) => {},
      setInterestPercent: ({ context, event }) => {},
    },
    actors: {
      fetchTokenPrice: fromPromise(async (xyz) => {
        // hard codde to fantom for now, we can work out how to make this multichain later
        // const slug = "fantom"
        // const uuid = makeLlamaUuid(slug, "axlUSDC")
        // const result = await fetchTokenPrice(uuid)
        // console.log("xyz", xyz)
        // console.log("uuid", uuid)
        // console.log("result", result)
        // return result
      }),
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
