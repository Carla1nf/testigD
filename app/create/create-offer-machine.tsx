import { Token, tokenSchema } from "@/lib/tokens"
import { fixedDecimals, roundIfClose } from "@/lib/utils"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { getAddress } from "viem"
import { assign, createMachine, fromPromise, raise } from "xstate"

const parseToken = (values: any) => {
  try {
    return tokenSchema.parse(values)
  } catch (error) {
    return undefined
  }
}

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
        collateralAmount0: undefined,
        collateralPrice0: 0,
        collateralValue0: 0, // value = amount * price

        collateralToken1: input?.collateralToken1 ?? undefined,
        collateralAmount1: undefined,
        collateralPrice1: 0,
        collateralValue1: 0, // value = amount * price

        token: input?.token ?? undefined,
        tokenAmount: undefined,
        tokenPrice: 0,
        tokenValue: 0, // value = amount * price

        // other values
        durationDays: undefined,
        interestPercent: undefined,
        numberOfPayments: undefined,
        estimatedApr: 0, // calculated from interestPercent and numberOfPayments
        ltvRatio: 0, // the calculated LTV ratio of collateral (value) / token (value)
        // the exact LTV match of either 25/50/75/Custom which is used to select buttons,
        // we will move this to a state once I know how to raise events from within an action
        ltv: undefined,
      }
    },
    states: {
      form: {
        description: "Form can be filled out in any order",
        states: {
          ltvRatio: {
            initial: "ltvcustom",
            states: {
              ltv25: {},
              ltv50: {},
              ltv75: {},
              ltvcustom: {},
              calculating: {
                invoke: {
                  input: ({ context, event }) => ({ context, event }),
                  src: fromPromise(async ({ input: { context, event } }) => {
                    const desiredLtv = Number(event.value)
                    if (context?.collateralValue0 || context?.collateralValue1) {
                      // Calculate the amount of token needed to satisfy the desired LTV ratio
                      // This will be used to determine the amount of token to borrow
                      const totalCollateralValue = Number(context.collateralValue0) + Number(context.collateralValue1)
                      const desiredTokenValue = Number(totalCollateralValue) * desiredLtv
                      const desiredTokenAmount = Number(desiredTokenValue) / Number(context.tokenPrice)
                      return desiredTokenAmount
                    }
                    return 0
                  }),
                  onDone: {
                    actions: ["raiseTokenAmount"],
                  },
                  onError: {
                    actions: ["raiseTokenAmount"],
                  },
                },
              },
            },
            on: {
              "ltv.25": { target: ".ltv25" },
              "ltv.50": { target: ".ltv50" },
              "ltv.75": { target: ".ltv75" },
              "ltv.custom": { target: ".ltvcustom" },
              forceLtvRatio: { target: ".calculating" },
            },
          },
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
                    actions: ["setCollateralPrice0", "setCollateralValue0", "updateLTV", "raiseLTV"],
                  },
                  onError: {
                    target: "idle",
                  },
                },
              },
              selected: {
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
                    actions: ["setCollateralToken1", "updateLTV", "raiseLTV", "updateChartValues", "validateForm"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken1: {
                    target: "selected",
                    guard: "isValidToken",
                    actions: ["setCollateralToken1", "updateLTV", "raiseLTV", "updateChartValues", "validateForm"],
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
                    target: "selecting",
                    guard: "isValidToken",
                    actions: ["setToken"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selecting: {
                invoke: {
                  input: ({ context }) => ({ context }),
                  src: fromPromise(async ({ input: { context } }) =>
                    fetchPrice({
                      event: { slug: chainIdToSlug(context.token.chainId), token: context.token },
                    })
                  ),
                  onDone: {
                    target: "selected",
                    actions: ["setTokenPrice", "setTokenValue", "updateLTV", "raiseLTV", "validateForm"],
                  },
                  onError: { target: "idle" },
                },
              },
              selected: {
                on: {
                  token: {
                    target: "selecting",
                    guard: "isValidToken",
                    actions: ["setToken"], // "updateLTV", "updateChartValues", "validateForm"
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
                    actions: ["setCollateralAmount0", "setCollateralValue0", "updateLTV", "raiseLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralAmount0: {
                    target: "hasValue",
                    guard: "isParsedFloat",
                    actions: ["setCollateralAmount0", "setCollateralValue0", "updateLTV", "raiseLTV", "validateForm"],
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
                    actions: ["setCollateralValue1", "updateLTV", "raiseLTV", "validateForm"],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralAmount1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: ["setCollateralValue1", "updateLTV", "raiseLTV", "validateForm"],
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
                    guard: "isParsedFloat",
                    actions: ["setTokenAmount", "setTokenValue", "updateLTV", "raiseLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  tokenAmount: {
                    target: "hasValue",
                    guard: "isParsedFloat",
                    actions: ["setTokenAmount", "setTokenValue", "updateLTV", "raiseLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
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
                    actions: ["setNumberOfPayments", "calculateEsitmatedApr", "validateForm"],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
              hasValue: {
                on: {
                  numberOfPayments: {
                    target: "hasValue",
                    guard: "isValidNumberOfPayments",
                    actions: ["setNumberOfPayments", "calculateEsitmatedApr", "validateForm"],
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
                    actions: ["setDurationDays", "calculateEsitmatedApr", "validateForm"],
                    description: "Must be an integer between 0 and 365",
                  },
                },
              },
              hasValue: {
                on: {
                  durationDays: {
                    target: "hasValue",
                    guard: "isValidDurationDays",
                    actions: ["setDurationDays", "calculateEsitmatedApr", "validateForm"],
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
                    actions: ["setInterestPercent", "calculateEsitmatedApr", "validateForm"],
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
          confirm: [
            {
              guard: ({ event }) => event.mode === "lend",
              target: "checkingLendAllowance",
            },
            {
              guard: ({ event }) => event.mode === "borrow",
              target: "checkingBorrowAllowance",
            },
          ],
          back: {
            target: "#createOffer.form.history",
          },
        },
      },
      checkingBorrowAllowance: {
        invoke: {
          src: "checkingBorrowAllowance",
          input: ({ context, event }) => ({ context, event }),
          onDone: [{ target: "creating" }],
          onError: [{ target: "approveBorrowAllowance" }],
        },
        on: {
          back: {
            target: "confirmation",
          },
        },
      },
      approveBorrowAllowance: {
        invoke: {
          src: "approveBorrowAllowance",
          input: ({ context, event }) => ({ context, event }),
          onDone: [{ target: "creating" }],
          onError: [{ target: "approveBorrowAllowance" }],
        },
        on: {
          retry: { target: "checkingBorrowAllowance" },
          back: {
            target: "confirmation",
          },
        },
      },
      checkingLendAllowance: {
        invoke: {
          src: "checkingLendAllowance",
          onDone: { target: "creating" },
          onError: { target: "checkingLendAllowanceError" },
        },
        on: {
          back: {
            target: "confirmation",
          },
        },
      },
      checkingLendAllowanceError: {
        on: {
          retry: { target: "checkingLendAllowance" },
          back: { target: "confirmation" },
        },
      },

      creating: {
        invoke: {
          src: "createOfferTransaction",
          id: "createOfferTransaction",
          onDone: [{ target: "created" }],
          onError: [{ target: "error" }],
        },
        on: {
          back: { target: "confirmation" },
        },
      },
      created: {
        type: "final",
      },
      error: {
        on: {
          retry: { target: "creating" },
        },
      },
    },
    types: {} as {
      context: {
        // four fields per token
        collateralToken0: Token | undefined
        collateralAmount0: number | undefined
        collateralPrice0: number
        collateralValue0: number

        // four fields per token
        collateralToken1: Token | undefined
        collateralAmount1: number | undefined
        collateralPrice1: number
        collateralValue1: number | undefined

        // four fields per token
        token: Token | undefined
        tokenAmount: number | undefined
        tokenPrice: number
        tokenValue: number | undefined

        durationDays: number | undefined
        interestPercent: number | undefined
        numberOfPayments: number | undefined
        ltvRatio: number | undefined
        estimatedApr: number
      }
      events:
        | { type: "token"; value: Token }
        | { type: "collateralToken0"; value: Token }
        | { type: "collateralToken1"; value: Token }
        // AMOUNTS
        | { type: "collateralAmount0"; value: number | undefined }
        | { type: "collateralAmount1"; value: number | undefined }
        | { type: "tokenAmount"; value: number | undefined }
        // OTHER EVENTS
        | { type: "back" }
        | { type: "next" }
        | { type: "retry" }
        | { type: "confirm"; mode: "lend" | "borrow" }
        | { type: "durationDays"; value: number }
        | { type: "interestPercent"; value: number }
        | { type: "numberOfPayments"; value: number }
        | { type: "ltv.25" }
        | { type: "ltv.50" }
        | { type: "ltv.75" }
        | { type: "ltv.custom" }
        | { type: "forceLtvRatio"; value: number }
    },
  },
  {
    actions: {
      // TOKENS
      setCollateralToken0: assign({
        collateralToken0: ({ event }) => {
          if (event && "value" in event) {
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
      updateLTV: assign({
        ltvRatio: ({ context }) => {
          if (context?.collateralValue0 && context?.tokenValue) {
            const totalCollateralValue = Number(context.collateralValue0) + Number(context.collateralValue1)
            const ltvValue = totalCollateralValue / context.tokenValue
            return roundIfClose(Number(1 / ltvValue) * 100, 0.05)
          }
          return 0
        },
      }),

      raiseLTV: raise(({ context }) => {
        const ratio = Number(fixedDecimals(context?.ltvRatio ?? 0, 3))
        switch (ratio) {
          case 25: {
            return { type: "ltv.25" as const }
          }
          case 50: {
            return { type: "ltv.50" as const }
          }
          case 75: {
            return { type: "ltv.75" as const }
          }
          default: {
            return { type: "ltv.custom" as const }
          }
        }
      }),
      //@ts-ignore
      raiseTokenAmount: raise(({ event }) => {
        //@ts-ignore
        const amount = Number(fixedDecimals(event?.output ?? 0, 2))
        return { type: "tokenAmount", value: amount }
      }),
      calculateEsitmatedApr: assign({
        estimatedApr: ({ context }) => {
          if (context?.durationDays && context?.interestPercent) {
            const apr = ((Number(context.interestPercent) / Number(context.durationDays)) * 365) / 100
            return Number(apr)
          }
          return 0
        },
      }),
      // @ts-ignore
      setNumberOfPayments: assign({ numberOfPayments: ({ event }) => Number(event?.value ?? 0) }),
      // @ts-ignore
      setDurationDays: assign({ durationDays: ({ event }) => Number(event?.value ?? 0) }),
      // @ts-ignore
      setInterestPercent: assign({ interestPercent: ({ event }) => Number(event?.value ?? 0) }),
      updateChartValues: ({ context, event }) => {},
      validateForm: ({ context, event }) => {},
    },
    actors: {
      createOfferTransaction: fromPromise(async () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true)
          }, 50000 * 1000)
        })
      }),
    },
    guards: {
      isFormComplete: ({ context }, params) => {
        return Boolean(
          context.collateralToken0 &&
            context.collateralAmount0 &&
            // context.collateralAmount1 &&
            // context.collateralToken1 &&
            context.token &&
            context.tokenAmount &&
            context.durationDays &&
            context.interestPercent &&
            context.numberOfPayments
        )
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
