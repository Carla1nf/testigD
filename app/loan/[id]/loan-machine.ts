import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "loan",
    initial: "isViewer",
    states: {
      isViewer: {},
      borrower: {
        initial: "hasPayments",
        states: {
          hasPayments: {},
        },
      },
      lender: {
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
                  "lender.claim.lent.tokens": {
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
                  "lender.retry": {
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
                  "lender.already.claimed.collateral": {
                    target: "completed",
                  },
                },
              },
              defaulted: {
                on: {
                  "lender.claim.collateral": {
                    target: "claimingCollateral",
                  },
                },
              },
              completed: {
                type: "final",
              },
              claimingCollateral: {
                description:
                  "The borrower defaulted so the lender doesn't get the lent tokens back. in this case, the lender can claim the collateral tokens, this is true if one or more payments has defaulted",
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
                  "lender.retry": {
                    target: "claimingCollateral",
                  },
                },
              },
            },
          },
        },
        type: "parallel",
      },
    },
    on: {
      "is.borrower": {
        target: ".borrower",
      },
      "is.viewer": {
        target: ".isViewer",
      },
      "is.lender": {
        target: ".lender",
      },
    },
    types: {
      events: {} as
        | { type: "loan.has.tokens.to.claim" }
        | { type: "loan.has.defaulted" }
        | { type: "is.viewer" }
        | { type: "is.borrower" }
        | { type: "is.lender" }
        | { type: "lender.claim.lent.tokens" }
        | { type: "lender.retry" }
        | { type: "lender.already.claimed.collateral" }
        | { type: "lender.claim.collateral" },
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
