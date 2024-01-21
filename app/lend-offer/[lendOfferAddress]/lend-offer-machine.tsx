import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "lendOffer",
    initial: "isNotOwner",
    states: {
      isNotOwner: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "is.erc20": {
                target: "erc20",
              },
              "is.nft": {
                target: "nft",
              },
            },
          },
          erc20: {
            initial: "canAcceptOffer",
            states: {
              canAcceptOffer: {
                on: {
                  "user.accept.offer": {
                    target: "acceptingOffer",
                  },
                },
              },
              acceptingOffer: {
                invoke: {
                  input: {},
                  src: "acceptOffer",
                  id: "acceptOffer",
                  onDone: [
                    {
                      target: "offerAccepted",
                    },
                  ],
                  onError: [
                    {
                      target: "acceptingOfferError",
                    },
                  ],
                },
              },
              offerAccepted: {
                type: "final",
              },
              acceptingOfferError: {
                on: {
                  "user.accept.offer.retry": {
                    target: "acceptingOffer",
                  },
                },
              },
              notEnoughAllowance: {
                on: {
                  "user.allowance.increase": {
                    target: "increaseCollateralAllowance",
                  },
                },
              },
              increaseCollateralAllowance: {
                invoke: {
                  input: {},
                  src: "increaseCollateralAllowance",
                  id: "increaseCollateralAllowance",
                  onDone: [
                    {
                      target: "canAcceptOffer",
                    },
                  ],
                  onError: [
                    {
                      target: "increaseAllowanceError",
                    },
                  ],
                },
              },
              increaseAllowanceError: {
                on: {
                  "user.increase.collateral.allowance.retry": {
                    target: "increaseCollateralAllowance",
                  },
                },
              },
            },
            on: {
              "user.has.allowance": {
                target: ".canAcceptOffer",
              },
              "user.not.has.allowance": {
                target: ".notEnoughAllowance",
              },
            },
          },
          nft: {
            initial: "idle",
            states: {
              idle: {},
              nftSelected: {
                initial: "checkNftAllowance",
                states: {
                  checkNftAllowance: {
                    invoke: {
                      input: {},
                      src: "checkNftAllowance",
                      id: "checkNftAllowance",
                      onDone: [
                        {
                          target: "canAcceptOffer",
                        },
                      ],
                      onError: [
                        {
                          target: "notEnoughAllowance",
                        },
                      ],
                    },
                  },
                  canAcceptOffer: {
                    on: {
                      "user.accept.offer": {
                        target: "acceptingOffer",
                      },
                    },
                  },
                  notEnoughAllowance: {
                    on: {
                      "user.allowance.increase": {
                        target: "increaseCollateralAllowance",
                      },
                    },
                  },
                  acceptingOffer: {
                    invoke: {
                      input: {},
                      src: "acceptOffer",
                      id: "acceptOffer",
                      onError: [
                        {
                          target: "acceptingOfferError",
                        },
                      ],
                      onDone: [
                        {
                          target: "offerAccepted",
                        },
                      ],
                    },
                  },
                  increaseCollateralAllowance: {
                    invoke: {
                      input: {},
                      src: "increaseCollateralAllowance",
                      id: "increaseCollateralAllowance",
                      onError: [
                        {
                          target: "increaseAllowanceError",
                        },
                      ],
                      onDone: [
                        {
                          target: "canAcceptOffer",
                        },
                      ],
                    },
                  },
                  acceptingOfferError: {
                    on: {
                      "user.accept.offer.retry": {
                        target: "acceptingOffer",
                      },
                    },
                  },
                  offerAccepted: {
                    type: "final",
                  },
                  increaseAllowanceError: {
                    on: {
                      "user.increase.collateral.allowance.retry": {
                        target: "increaseCollateralAllowance",
                      },
                    },
                  },
                },
              },
            },
            on: {
              "select.nft": {
                target: ".nftSelected",
              },
            },
          },
        },
        on: {
          owner: {
            target: "#lendOffer.isOwner.idle",
          },
        },
      },
      isOwner: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "owner.cancel": {
                target: "cancelling",
              },
              "owner.editing": {
                target: "editing",
              },
            },
          },
          cancelling: {
            invoke: {
              input: {},
              src: "cancelOffer",
              onDone: [
                {
                  target: "cancelled",
                },
              ],
              onError: [
                {
                  target: "errorCancellingOffer",
                },
              ],
            },
          },
          editing: {
            on: {
              "owner.cancel": {
                target: "idle",
              },
              "owner.update.offer": {
                target: "checkPrincipleAllowance",
              },
            },
          },
          cancelled: {
            type: "final",
          },
          errorCancellingOffer: {
            on: {
              "owner.retry": {
                target: "cancelling",
              },
            },
          },
          checkPrincipleAllowance: {
            invoke: {
              input: {},
              src: "checkPrincipleAllowance",
              id: "checkPrincipleAllowance",
              onDone: [
                {
                  target: "updatingOffer",
                },
              ],
              onError: [
                {
                  target: "increasePrincipleAllowance",
                },
              ],
            },
          },
          updatingOffer: {
            invoke: {
              input: {},
              src: "updateOffer",
              id: "updateOffer",
              onDone: [
                {
                  target: "idle",
                },
              ],
              onError: [
                {
                  target: "errorUpdatingOffer",
                },
              ],
            },
            on: {
              cancel: {
                target: "editing",
              },
            },
          },
          increasePrincipleAllowance: {
            invoke: {
              input: {},
              src: "increasePrincipleAllowance",
              id: "increasePrincipleAllowance",
              onDone: [
                {
                  target: "updatingOffer",
                },
              ],
              onError: [
                {
                  target: "errorIncreasingPrincipleAllowance",
                },
              ],
            },
            on: {
              cancel: {
                target: "editing",
              },
            },
          },
          errorUpdatingOffer: {
            on: {
              "owner.update.offer.retry": {
                target: "updatingOffer",
              },
            },
          },
          errorIncreasingPrincipleAllowance: {
            on: {
              "owner.increase.principle.allowance.retry": {
                target: "increasePrincipleAllowance",
              },
              cancel: {
                target: "editing",
              },
            },
          },
        },
        on: {
          "not.owner": {
            target: "#lendOffer.isNotOwner.idle",
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "owner" }
        | { type: "cancel" }
        | { type: "is.nft" }
        | { type: "is.erc20" }
        | { type: "not.owner" }
        | { type: "select.nft" }
        | { type: "owner.retry" }
        | { type: "owner.cancel" }
        | { type: "owner.editing" }
        | { type: "user.accept.offer" }
        | { type: "owner.update.offer" }
        | { type: "user.has.allowance" }
        | { type: "user.not.has.allowance" }
        | { type: "user.accept.offer.retry" }
        | { type: "user.allowance.increase" }
        | { type: "owner.update.offer.retry" }
        | { type: "owner.increase.principle.allowance.retry" }
        | { type: "user.increase.collateral.allowance.retry" },
    },
  },
  {
    actions: {},
    actors: {
      acceptOffer: createMachine({
        /* ... */
      }),
      cancelOffer: createMachine({
        /* ... */
      }),
      updateOffer: createMachine({
        /* ... */
      }),
      checkNftAllowance: createMachine({
        /* ... */
      }),
      checkPrincipleAllowance: createMachine({
        /* ... */
      }),
      increasePrincipleAllowance: createMachine({
        /* ... */
      }),
      increaseCollateralAllowance: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  }
)
