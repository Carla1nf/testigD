import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "v2-lendOffer",
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
            initial: "idle",
            states: {
              idle: {
                on: {
                  "user.accept.offer": {
                    target: "checkCollateralAllowance",
                  },
                },
              },
              checkCollateralAllowance: {
                invoke: {
                  input: {},
                  src: "checkCollateralAllowance",
                  id: "checkCollateralAllowance",
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
              increaseCollateralAllowance: {
                invoke: {
                  input: {},
                  src: "increaseCollateralAllowance",
                  id: "increaseCollateralAllowance",
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
              increaseAllowanceError: {
                on: {
                  "user.increase.collateral.allowance.retry": {
                    target: "increaseCollateralAllowance",
                  },
                },
              },
            },
            on: {
              "user.cancel": {
                target: ".idle",
              },
            },
          },
          nft: {
            initial: "idle",
            states: {
              idle: {},
              nftSelected: {
                initial: "idle",
                states: {
                  idle: {
                    on: {
                      "user.accept.offer": {
                        target: "checkNftAllowance",
                      },
                    },
                  },
                  checkNftAllowance: {
                    invoke: {
                      input: {},
                      src: "checkNftAllowance",
                      id: "checkNftAllowance",
                      onDone: [
                        {
                          target: "acceptingOffer",
                        },
                      ],
                      onError: [
                        {
                          target: "approveNft",
                        },
                      ],
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
                  approveNft: {
                    invoke: {
                      src: "approveNft",
                      id: "approveNft",
                      input: {},
                      onDone: [
                        {
                          target: "acceptingOffer",
                        },
                      ],
                      onError: [
                        {
                          target: "approveNftError",
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
                  approveNftError: {
                    on: {
                      "user.approve.nft.retry": {
                        target: "approveNft",
                      },
                    },
                  },
                },
                on: {
                  "user.nft.cancel": {
                    target: ".idle",
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
            target: "#v2-lendOffer.isOwner.idle",
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
                target: "#v2-lendOffer.isOwner.editing.idle",
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
          editing: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  "owner.update.offer": {
                    target: "checkPrincipleAllowance",
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
                  onError: [
                    {
                      target: "errorUpdatingOffer",
                    },
                  ],
                  onDone: [
                    {
                      target: "offerUpdated",
                    },
                  ],
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
              },
              errorUpdatingOffer: {
                on: {
                  "owner.update.offer.retry": {
                    target: "updatingOffer",
                  },
                },
              },
              offerUpdated: {
                on: {
                  "owner.update.offer": {
                    target: "checkPrincipleAllowance",
                  },
                },
              },
              errorIncreasingPrincipleAllowance: {
                on: {
                  "owner.increase.principle.allowance.retry": {
                    target: "increasePrincipleAllowance",
                  },
                },
              },
            },
            on: {
              "owner.cancel.editing": {
                target: "idle",
              },
            },
          },
        },
        on: {
          "not.owner": {
            target: "#v2-lendOffer.isNotOwner.idle",
          },
        },
      },
    },
    types: {
      events: {} as
        | { type: "owner" }
        | { type: "is.nft" }
        | { type: "is.erc20" }
        | { type: "not.owner" }
        | { type: "select.nft" }
        | { type: "owner.retry" }
        | { type: "user.cancel" }
        | { type: "owner.cancel" }
        | { type: "owner.editing" }
        | { type: "user.accept.offer" }
        | { type: "owner.update.offer" }
        | { type: "owner.cancel.editing" }
        | { type: "user.accept.offer.retry" }
        | { type: "user.allowance.increase" }
        | { type: "owner.update.offer.retry" }
        | { type: "owner.increase.principle.allowance.retry" }
        | { type: "user.increase.collateral.allowance.retry" }
        | { type: "user.approve.nft.retry" }
        | { type: "user.nft.cancel" },
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
      checkCollateralAllowance: createMachine({
        /* ... */
      }),
      increasePrincipleAllowance: createMachine({
        /* ... */
      }),
      increaseCollateralAllowance: createMachine({
        /* ... */
      }),
      approveNft: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  }
)
