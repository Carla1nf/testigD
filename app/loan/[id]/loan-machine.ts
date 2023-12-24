import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "loan",
    initial: "isViewer",
    states: {
      isViewer: {},
      borrower: {
        states: {
          defaulted: {
            initial: "notDefaulted",
            states: {
              notDefaulted: {
                on: {
                  "loan.has.defaulted": {
                    target: "hasDefaulted",
                  },
                },
              },
              hasDefaulted: {},
            },
          },
          payments: {
            initial: "noPaymentsDue",
            states: {
              noPaymentsDue: {
                on: {
                  "loan.has.payment.due": {
                    target: "hasPaymentDue",
                  },
                },
              },
              hasPaymentDue: {
                on: {
                  "borrower.check.payment.allowance": {
                    target: "checkingAllowance",
                  },
                },
              },
              checkingAllowance: {
                invoke: {
                  src: "checkBorrowerHasPaymentAllowance",
                  id: "checkBorrowerHasPaymentAllowance",
                  onDone: [
                    {
                      target: "hasAllowance",
                    },
                  ],
                  onError: [
                    {
                      target: "errorCheckingAllowance",
                    },
                  ],
                },
              },
              hasAllowance: {},
              errorCheckingAllowance: {
                on: {
                  "borrower.retry.check.allowance": {
                    target: "checkingAllowance",
                  },
                },
              },
            },
          },
        },
        type: "parallel",
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
                  "lender.retry.lent.tokens": {
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
                    target: "hasDefaulted",
                  },
                  "lender.already.claimed.collateral": {
                    target: "completed",
                  },
                },
              },
              hasDefaulted: {
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
                  id: "claimCollateral",
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
                  "lender.retry.claim.collateral": {
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
        | { type: "lender.already.claimed.collateral" }
        | { type: "lender.claim.collateral" }
        | { type: "lender.retry.lent.tokens" }
        | { type: "lender.retry.claim.collateral" }
        | { type: "borrower.retry.check.allowance" }
        | { type: "borrower.check.payment.allowance" }
        | { type: "loan.has.payment.due" },
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
      checkBorrowerHasPaymentAllowance: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  }
)
