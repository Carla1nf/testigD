import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "loan",
    initial: "isViewer",
    states: {
      isViewer: {},
      borrower: {
        initial: "notDefaulted",
        states: {
          notDefaulted: {
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
                      target: "payDebt",
                    },
                  ],
                  onError: [
                    {
                      target: "errorCheckingAllowance",
                    },
                  ],
                },
              },
              payDebt: {
                on: {
                  "borrower.pay.debt": {
                    target: "payingDebt",
                  },
                },
              },
              errorCheckingAllowance: {
                on: {
                  "borrower.approve.allowance": {
                    target: "approvingAllowance",
                  },
                },
              },
              payingDebt: {
                invoke: {
                  src: "borrowerPayingDebt",
                  id: "borrowerPayingDebt",
                  onDone: [
                    {
                      target: "completed",
                    },
                  ],
                  onError: [
                    {
                      target: "errorPayingDebt",
                    },
                  ],
                },
              },
              approvingAllowance: {
                invoke: {
                  src: "borrowerApproveAllowance",
                  id: "borrowerApproveAllowance",
                  onDone: [
                    {
                      target: "payDebt",
                    },
                  ],
                  onError: [
                    {
                      target: "errorApprovingAllowance",
                    },
                  ],
                },
              },
              completed: {
                type: "final",
              },
              errorPayingDebt: {
                on: {
                  "borrower.retry.paying.debt": {
                    target: "payingDebt",
                  },
                },
              },
              errorApprovingAllowance: {
                on: {
                  "borrower.retry.approve.allowance": {
                    target: "approvingAllowance",
                  },
                },
              },
            },
            on: {
              "loan.has.defaulted": {
                target: "hasDefaulted",
              },
            },
          },
          hasDefaulted: {},
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
                  "has.already.claimed.collateral": {
                    target: "alreadyClaimed",
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
              alreadyClaimed: {
                type: "final",
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
        | { type: "loan.has.payment.due" }
        | { type: "borrower.check.payment.allowance" }
        | { type: "borrower.pay.debt" }
        | { type: "borrower.approve.allowance" }
        | { type: "borrower.retry.paying.debt" }
        | { type: "borrower.retry.approve.allowance" }
        | { type: "loan.has.defaulted" }
        | { type: "loan.has.tokens.to.claim" }
        | { type: "lender.claim.lent.tokens" }
        | { type: "lender.retry.lent.tokens" }
        | { type: "lender.already.claimed.collateral" }
        | { type: "lender.claim.collateral" }
        | { type: "lender.retry.claim.collateral" }
        | { type: "is.borrower" }
        | { type: "is.viewer" }
        | { type: "is.lender" }
        | { type: "has.already.claimed.collateral" },
    },
  },
  {
    actions: {},
    actors: {
      checkBorrowerHasPaymentAllowance: createMachine({
        /* ... */
      }),
      borrowerPayingDebt: createMachine({
        /* ... */
      }),
      borrowerApproveAllowance: createMachine({
        /* ... */
      }),
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
