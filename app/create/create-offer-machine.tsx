import { Token, tokenSchema } from "@/lib/tokens"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { getAddress } from "viem"
import { assign, createMachine, fromPromise } from "xstate"

const parseToken = (values: any) => {
  try {
    return tokenSchema.parse(values)
  } catch (error) {
    return undefined
  }
}

export type Ltv = "25" | "50" | "75" | "Custom"

const chainIdToSlug = (chainId: number) => {
  switch (chainId) {
    case 250: {
      return "fantom"
    }
    case 1: {
      return "ethereum"
    }
    default: {
      return "ethereum"
    }
  }
}

const fetchPrice = async ({ event }: { event: { slug: string; token: Token } }) => {
  const uuid = makeLlamaUuid(event.slug, getAddress(event.token.address))
  const result = await fetchTokenPrice(uuid)
  return result?.price ?? 0
}

export const machine = createMachine(
  {
    id: "createOffer",
    initial: "form",
    context: ({ input }: { input: any }) => {
      return {
        collateralToken0: input?.collateralToken0 ?? undefined,
        collateralAmount0: 0,
        collateralPrice0: 0,
        collateralValue0: 0, // value = amount * price

        collateralToken1: input?.collateralToken1 ?? undefined,
        collateralAmount1: 0,
        collateralPrice1: 0,
        collateralValue1: 0, // value = amount * price

        token: input?.token ?? undefined,
        tokenAmount: 0,
        tokenPrice: 0,
        tokenValue: 0, // value = amount * price

        // other values
        durationDays: undefined,
        interestPercent: undefined,
        numberOfPayments: undefined,
        ltvValue: 0, // the clacukated LTV ratio of collateral (value) / token (value)
        // the exact LTV match of either 25/50/75/Custom which is used to select buttons,
        // we will move this to a state once I know how to raise events from within an action
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
                  input: ({ context }) => ({ context }),
                  src: fromPromise(async ({ input: { context } }) => {
                    return fetchPrice({
                      event: { slug: chainIdToSlug(context.collateralToken0.chainId), token: context.collateralToken0 },
                    })
                  }),
                  onDone: {
                    target: "selected",
                    actions: ["setCollateralPrice0", "setCollateralValue0"],
                  },
                  onError: {
                    target: "idle",
                    // todo: alert the outside world thast the price wasnt available
                  },
                },
              },
              selected: {
                // entry: ["updateLTV", "updateChartValues", "validateForm"],
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
          collateralAmount0: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralAmount0: {
                    target: "hasValue",
                    guard: "isParsedFloat",
                    actions: ["setCollateralAmount0", "setCollateralValue0", "updateLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralAmount0: {
                    target: "hasValue",
                    guard: "isParsedFloat",
                    actions: ["setCollateralAmount0", "setCollateralValue0", "updateLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
                  },
                },
              },
            },
          },
          collateralAmount1: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralAmount1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue1", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralAmount1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue1", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
          tokenAmount: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  tokenAmount: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setTokenValue", "updateLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  tokenAmount: {
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
        // four fiuelds per token
        collateralToken0: Token | undefined
        collateralAmount0: number | undefined
        collateralPrice0: number
        collateralValue0: number

        // four fields per token
        collateralToken1: Token | undefined
        collateralValue1: number | undefined
        collateralPrice1: number
        collateralAmount1: number

        // four fields per token
        token: Token | undefined
        tokenAmount: number
        tokenPrice: number
        tokenValue: number | undefined

        durationDays: number | undefined
        interestPercent: number | undefined
        numberOfPayments: number | undefined
        ltvValue: number | undefined
        ltv: Ltv | undefined
      }
      events:
        | { type: "token"; value: Token }
        | { type: "collateralToken0"; value: Token }
        | { type: "collateralToken1"; value: Token }
        // AMOUNTS
        | { type: "collateralAmount0"; value: number }
        | { type: "collateralAmount1"; value: number }
        | { type: "tokenAmount"; value: number }
        // OTHER EVENTS
        | { type: "back" }
        | { type: "next" }
        | { type: "retry" }
        | { type: "confirm" }
        | { type: "durationDays"; value: number }
        | { type: "interestPercent"; value: number }
        | { type: "numberOfPayments"; value: number }
    },
  },
  {
    actions: {
      // TOKENS
      setCollateralToken0: assign({
        collateralToken0: ({ event }) => {
          if (event && "value" in event) {
            console.log("event", event)

            return parseToken(event.value)
          }
          return undefined
        },
      }),
      setCollateralToken1: assign({
        collateralToken1: ({ event }) => {
          if (event && "value" in event) {
            return parseToken(event.value)
          }
          return undefined
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
      // AMOUNTS
      setCollateralAmount0: assign({
        collateralAmount0: ({ event }) => {
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      setCollateralAmount1: assign({
        collateralAmount1: ({ event }) => {
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      setTokenAmount: assign({
        tokenAmount: ({ event }) => {
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      // PRICES
      setCollateralPrice0: assign({
        collateralPrice0: ({ event }) => {
          if (event && "output" in event) {
            return Number(event.output)
          }
          return 0
        },
      }),
      setCollateralPrice1: assign({
        collateralPrice1: ({ event }) => {
          if (event && "output" in event) {
            return Number(event.output)
          }
          return 0
        },
      }),
      setTokenPrice: assign({
        tokenPrice: ({ event }) => {
          if (event && "output" in event) {
            return Number(event.output)
          }
          return 0
        },
      }),
      // VALUES
      setCollateralValue0: assign({
        collateralValue0: ({ context }) => {
          if (context?.collateralAmount0 && context?.collateralPrice0) {
            return Number(context.collateralAmount0) * Number(context.collateralPrice0)
          }
          return 0
        },
      }),
      setCollateralValue1: assign({
        collateralValue1: ({ context }) => {
          if (context?.collateralAmount1 && context?.collateralPrice1) {
            return Number(context.collateralAmount1) * Number(context.collateralPrice1)
          }
          return 0
        },
      }),
      setTokenValue: assign({
        tokenValue: ({ context }) => {
          if (context?.tokenAmount && context?.tokenPrice) {
            return Number(context.tokenAmount) * Number(context.tokenPrice)
          }
          return 0
        },
      }),
      // OTHER SETTERS
      updateLTV: ({ context, event }) => {},
      updateChartValues: ({ context, event }) => {},
      setNumberOfPayments: ({ context, event }) => {},
      validateForm: ({ context, event }) => {},
      setDurationDays: ({ context, event }) => {},
      setInterestPercent: ({ context, event }) => {},
    },
    actors: {},
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
      isParsedFloat: ({ context, event }, params) => {
        if ("value" in event) {
          // @ts-ignore
          const parsed = parseFloat(event.value)
          return !Number.isNaN(parsed) && parsed >= 0
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
