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

// export const tokenPriceMachine = createMachine({
//   id: "tokenPriceMachine",
//   initial: "idle",
//   states: {
//     idle: {
//       on: {
//         fetchPrice: {
//           target: "fetching",
//           actions: [],
//         },
//       },
//     },
//     fetching: {
//       invoke: {
//         src: fromPromise(async ({ input: { event } }) => {
//           return fetchPrice({ event })
//         }),
//         input: ({ event }) => ({ event }),
//         onDone: {
//           target: "idle",
//         },
//         onError: {
//           target: "idle",
//           // todo: alert the outside world thast the price wasnt available
//         },
//       },
//     },
//   },
// })

export const tokenMachine = createMachine(
  {
    id: "token",
    type: "parallel",
    context: ({ input }: { input: any }) => {
      return {
        token: input?.token ?? undefined,
        amount: 0,
        price: 0.0,
        value: 0,
      }
    },
    states: {
      token: {
        initial: "idle",
        states: {
          idle: {
            on: {
              token: {
                target: "selecting",
                guard: "isValidToken",
                actions: ["setToken", "setValue"],
                description: "event must contain a valid token",
              },
            },
          },
          selecting: {
            invoke: {
              src: fromPromise(async ({ input: { context } }) =>
                fetchPrice({ event: { slug: chainIdToSlug(context.token.chainId), token: context.token } })
              ),
              input: ({ context }) => ({ context }),
              onDone: {
                target: "idle",
                actions: ["setPrice", "setValue"],
              },
              onError: {
                target: "idle",
                // todo: alert the outside world thast the price wasnt available
              },
            },
          },
          selected: {
            on: {
              token: {
                target: "selecting",
                guard: "isValidToken",
                actions: ["setToken", "setValue"],
                description: "event must contain a valid token",
              },
            },
          },
        },
      },
      amount: {
        initial: "idle",
        states: {
          idle: {
            on: {
              amount: {
                target: "hasAmount",
                guard: "isParsedFloat",
                actions: ["setAmount", "setValue"],
                description: "Must be an integer value 0 or above",
              },
            },
          },
          hasAmount: {
            on: {
              amount: {
                target: "hasAmount",
                guard: "isParsedFloat",
                actions: ["setAmount", "setValue"],
                description: "Must be an integer value 0 or above",
              },
            },
          },
        },
      },
    },

    types: {} as {
      context: {
        token: Token | undefined
        amount: number | undefined
        price: number
        value: number
      }
      events: { type: "token"; value: Token } | { type: "amount"; value: number } | { type: "price"; value: number }
    },
  },
  {
    actions: {
      setAmount: assign({
        amount: ({ event }) => {
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
      setPrice: assign({
        price: ({ event }) => {
          if (event && "output" in event) {
            return Number(event.output)
          }
          return 0
        },
      }),
      setValue: assign({
        value: ({ context }) => {
          const amount = context?.amount ?? 0
          const price = context?.price ?? 0
          if (amount && price) {
            return amount * price
          }
          return 0
        },
      }),
    },
    actors: {},
    guards: {
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
    },
    delays: {},
  }
)
