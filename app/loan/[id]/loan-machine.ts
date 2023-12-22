import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "loan",
    initial: "isViewer",
    states: {
      isViewer: {
        on: {
          "is.debt.owner": {
            target: "isDebtOwner",
          },
          "is.collateral.owner": {
            target: "isCollateralOwner",
          },
        },
      },
      isDebtOwner: {
        states: {
          claim: {
            initial: "notAvailable",
            states: {
              notAvailable: {
                on: {
                  "loan.has.tokens.to.claim": {
                    target: "available",
                  },
                },
              },
              available: {
                on: {
                  "owner.claim.lent.tokens": {
                    target: "claimingLentTokens",
                  },
                },
              },
              claimingLentTokens: {
                invoke: {
                  src: "claimLentTokens",
                  id: "claimLentTokens",
                  onDone: [
                    {
                      target: "completed",
                    },
                  ],
                  onError: [
                    {
                      target: "errorClaimingLentTokens",
                    },
                  ],
                },
              },
              completed: {
                type: "final",
              },
              errorClaimingLentTokens: {
                on: {
                  "owner.retry": {
                    target: "claimingLentTokens",
                  },
                },
              },
            },
          },
          defaulted: {
            initial: "notDefaulted",
            states: {
              notDefaulted: {
                on: {
                  "loan.has.defaulted": {
                    target: "defaulted",
                  },
                  "owner.already.claimed.collateral": {
                    target: "completed",
                  },
                },
              },
              defaulted: {
                on: {
                  "owner.claim.collateral": {
                    target: "claimingCollateral",
                  },
                },
              },
              completed: {
                type: "final",
              },
              claimingCollateral: {
                description:
                  "The user defaulted so the owner doesn't get the lent tokens back.\nin this case, the owner can claim the collateral tokens, this is true if one or more payments has defaulted",
                invoke: {
                  src: "claimCollateral",
                  id: "claimColateral",
                  onDone: [
                    {
                      target: "completed",
                    },
                  ],
                  onError: [
                    {
                      target: "errorClaimingCollateral",
                    },
                  ],
                },
              },
              errorClaimingCollateral: {
                on: {
                  "owner.retry": {
                    target: "claimingCollateral",
                  },
                },
              },
            },
          },
        },
        type: "parallel",
      },
      isCollateralOwner: {
        initial: "hasPayments",
        states: {
          hasPayments: {},
        },
      },
    },
    types: {
      events: {} as
        | { type: "owner.retry" }
        | { type: "owner.claim.collateral" }
        | { type: "owner.claim.lent.tokens" }
        | { type: "loan.has.tokens.to.claim" }
        | { type: "loan.has.defaulted" }
        | { type: "owner.already.claimed.collateral" }
        | { type: "is.debt.owner" }
        | { type: "is.collateral.owner" },
    },
  },
  {
    actions: {},
    actors: {
      claimLentTokens: createMachine({
        /* ... */
      }),
      claimCollateral: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  }
)
