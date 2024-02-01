import { UserNftInfo } from "@/hooks/useNftInfo"
import { Token, getValuedAsset, isNft, tokenSchema } from "@/lib/tokens"
import { fixedDecimals, roundIfClose } from "@/lib/utils"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { getAddress } from "viem"
import { assign, createMachine, fromPromise, raise } from "xstate"

const parseToken = (values: any) => {
  try {
    return tokenSchema.parse(values)
  } catch (error) {
    console.error(error)

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

export type LendingMode = "lend" | "borrow"

export const machine = createMachine(
  {
    id: "createOffer",
    initial: "form",
    context: ({ input }: { input: any }) => {
      return {
        collateralToken: input?.collateralToken ?? undefined,
        collateralAmount: undefined,
        collateralPrice: 0,
        collateralValue: 0, // value = amount * price
        collateralUserNft: undefined,
        wantedValueVeNFT: 0,
        token: input?.token ?? undefined,
        tokenAmount: undefined,
        tokenPrice: 0,
        tokenValue: 0, // value = amount * price
        tokenUserNft: undefined,

        // other values
        durationDays: undefined,
        interestPercent: undefined,
        numberOfPayments: undefined,
        estimatedApr: 0, // calculated from interestPercent and numberOfPayments
        ltvRatio: 0, // the calculated LTV ratio of collateral (value) / token (value)
        // the exact LTV match of either 25/50/75/Custom which is used to select buttons,
        // we will move this to a state once I know how to raise events from within an action
        ltv: undefined,

        mode: "lend" as LendingMode,
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
                    if (context?.collateralValue) {
                      // Calculate the amount of token needed to satisfy the desired LTV ratio
                      // This will be used to determine the amount of token to borrow
                      const totalCollateralValue = Number(context.collateralValue)
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
          collateralToken: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralToken: {
                    target: "selecting",
                    guard: "isValidToken",
                    actions: ["clearCollateralUserNft", "setCollateralToken"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selecting: {
                invoke: {
                  input: ({ context }) => ({ context }),
                  src: fromPromise(async ({ input: { context } }) => {
                    return fetchPrice({
                      event: {
                        slug: chainIdToSlug(context.collateralToken.chainId),
                        token: getValuedAsset(context.collateralToken, chainIdToSlug(context.collateralToken.chainId)),
                      },
                    })
                  }),
                  onDone: {
                    target: "selected",
                    actions: ["setCollateralPrice", "setCollateralValue", "updateLTV", "raiseLTV", "validateForm"],
                  },
                  onError: {
                    target: "idle",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken: {
                    target: "selecting",
                    guard: "isValidToken",
                    actions: ["clearCollateralUserNft", "setCollateralToken"],
                    description: "event must contain a valid token",
                  },
                },
              },
            },
          },
          collateralUserNft: {
            initial: "idle",
            on: {
              collateralUserNft: {
                target: ".selected",
                actions: "setCollateralUserNft",
                description: "event must contain valid user nft info ",
              },
            },
            states: {
              idle: {},
              selected: {},
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
                    actions: ["clearTokenUserNft", "setToken"],
                    description: "event must contain a valid token",
                  },
                },
              },
              selecting: {
                invoke: {
                  input: ({ context }) => ({ context }),
                  src: fromPromise(async ({ input: { context } }) =>
                    fetchPrice({
                      event: {
                        slug: chainIdToSlug(context.token.chainId),
                        token: getValuedAsset(context.token, chainIdToSlug(context.token.chainId)),
                      },
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
                    actions: ["clearTokenUserNft", "setToken"],
                    description: "event must contain a valid token",
                  },
                },
              },
            },
          },
          tokenUserNft: {
            initial: "idle",
            on: {
              tokenUserNft: {
                target: ".selected",
                actions: "setTokenUserNft",
                description: "event must contain valid user nft info ",
              },
            },
            states: {
              idle: {},
              selected: {},
            },
          },
          collateralAmount: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralAmount: {
                    target: "hasValue",
                    guard: "isParsedFloat",
                    actions: ["setCollateralAmount0", "setCollateralValue", "updateLTV", "raiseLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralAmount: {
                    target: "hasValue",
                    guard: "isParsedFloat",
                    actions: ["setCollateralAmount0", "setCollateralValue", "updateLTV", "raiseLTV", "validateForm"],
                    description: "Must be an float value 0 or above",
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
                    actions: ["setNumberOfPayments", "calculateEstimatedApr", "validateForm"],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
              hasValue: {
                on: {
                  numberOfPayments: {
                    target: "hasValue",
                    guard: "isValidNumberOfPayments",
                    actions: ["setNumberOfPayments", "calculateEstimatedApr", "validateForm"],
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
                    actions: ["setDurationDays", "calculateEstimatedApr", "validateForm"],
                    description: "Must be an integer between 0 and 365",
                  },
                },
              },
              hasValue: {
                on: {
                  durationDays: {
                    target: "hasValue",
                    guard: "isValidDurationDays",
                    actions: ["setDurationDays", "calculateEstimatedApr", "validateForm"],
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
                    actions: ["setInterestPercent", "calculateEstimatedApr", "validateForm"],
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
          mode: {
            actions: ["setMode"],
          },
        },
        type: "parallel",
      },
      confirmation: {
        on: {
          confirm: [
            {
              guard: ({ context }) => context.mode === "lend",
              target: "checkingLendAllowance",
            },
            {
              guard: ({ context }) => context.mode === "borrow",
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
          onError: [{ target: "approveBorrowAllowance" }],
          onDone: [{ target: "creating" }],
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
          onError: [{ target: "approveBorrowAllowance" }],
          onDone: [{ target: "creating" }],
        },
        on: {
          retry: { target: "checkingBorrowAllowance" },
          back: { target: "confirmation" },
        },
      },
      checkingLendAllowance: {
        invoke: {
          src: "checkingLendAllowance",
          input: ({ context, event }) => ({ context, event }),
          onDone: { target: "creating" },
          onError: { target: "approveLendAllowance" },
        },
        on: {
          back: { target: "confirmation" },
        },
      },
      approveLendAllowance: {
        invoke: {
          src: "approveLendAllowance",
          input: ({ context, event }) => ({ context, event }),
          onError: [{ target: "checkingLendAllowance" }],
          onDone: [{ target: "creating" }],
        },
        on: {
          retry: { target: "checkingLendAllowance" },
          back: { target: "confirmation" },
        },
      },
      creating: {
        invoke: {
          src: "creatingOffer",
          id: "creatingOffer",
          input: ({ context, event }) => ({ context, event }),
          onDone: [{ target: "created" }],
          onError: [{ target: "error" }],
        },
        on: {
          back: { target: "confirmation" },
        },
      },
      created: {
        on: {
          again: { target: "confirmation" },
          back: { target: "confirmation" },
        },
      },
      error: {
        on: {
          retry: { target: "creating" },
          back: { target: "confirmation" },
        },
      },
    },
    types: {} as {
      context: {
        // four fields per token
        collateralToken: Token | undefined
        collateralAmount: number | undefined
        collateralPrice: number
        collateralValue: number
        collateralUserNft: UserNftInfo | undefined

        // four fields per token
        token: Token | undefined
        tokenAmount: number | undefined
        tokenPrice: number
        tokenValue: number | undefined
        tokenUserNft: UserNftInfo | undefined

        durationDays: number | undefined
        interestPercent: number | undefined
        numberOfPayments: number | undefined
        ltvRatio: number | undefined
        estimatedApr: number
        mode: LendingMode
      }
      events:
        | { type: "token"; value: Token }
        | { type: "collateralToken"; value: Token }
        | { type: "collateralUserNft"; value: UserNftInfo }
        // AMOUNTS
        | { type: "collateralAmount"; value: number | undefined }
        | { type: "tokenAmount"; value: number | undefined }
        | { type: "tokenUserNft"; value: UserNftInfo }
        // OTHER EVENTS
        | { type: "back" }
        | { type: "next" }
        | { type: "retry" }
        | { type: "confirm" }
        | { type: "mode"; mode: LendingMode }
        | { type: "again" }
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
      setMode: assign({
        mode: ({ event, context }) => {
          if (event && "mode" in event && ["lend", "borrow"].includes(event.mode)) {
            return event.mode
          }
          return context.mode
        },
      }),
      // TOKENS
      setCollateralToken: assign({
        collateralToken: ({ event }) => {
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
        collateralAmount: ({ event }) => {
          console.log(event, "calling")

          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      setTokenAmount: assign({
        tokenAmount: ({ event }) => {
          console.log(event, "calling")
          if (event && "value" in event) {
            return Number(event.value)
          }
          return 0
        },
      }),
      // PRICES
      setCollateralPrice: assign({
        collateralPrice: ({ event }) => {
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
      setCollateralValue: assign({
        collateralValue: ({ context }) => {
          if (context?.collateralAmount && context?.collateralPrice) {
            return Number(context.collateralAmount) * Number(context.collateralPrice)
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
      // User NFTs
      clearCollateralUserNft: assign({
        collateralUserNft: undefined,
      }),
      setCollateralUserNft: assign({
        collateralUserNft: ({ event }) => {
          if (event && "value" in event) {
            return event.value as UserNftInfo
          }
          return undefined
        },
      }),
      clearTokenUserNft: assign({
        tokenUserNft: undefined,
      }),
      setTokenUserNft: assign({
        tokenUserNft: ({ event }) => {
          if (event && "value" in event) {
            return event.value as UserNftInfo
          }
          return undefined
        },
      }),
      // OTHER SETTERS
      updateLTV: assign({
        ltvRatio: ({ context }) => {
          if (context?.collateralValue && context?.tokenValue) {
            const totalCollateralValue = Number(context.collateralValue)
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
      calculateEstimatedApr: assign({
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
    },
    actors: {
      createBorrowOffer: fromPromise(async () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true)
          }, 50000 * 1000)
        })
      }),
    },
    guards: {
      isFormComplete: ({ context }) => {
        const isComplete = Boolean(
          context.collateralToken &&
            context.collateralAmount &&
            context.token &&
            context.tokenAmount &&
            context.durationDays &&
            context.interestPercent &&
            context.numberOfPayments
        )

        // if we have fNFTs then make sure the underlying is also selected
        if (isNft(context.collateralToken) && !context.collateralUserNft) {
          return false
        }
        if (isNft(context.token) && !context.tokenUserNft) {
          return false
        }
        return isComplete
      },
      isValidToken: ({ event }) => {
        if ("value" in event) {
          const result = parseToken(event.value)
          return Boolean(result)
        }
        return false
      },
      isNonNegativeInteger: ({ context, event }, params) => {
        if ("value" in event) {
          return Number(event.value) >= 0
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
