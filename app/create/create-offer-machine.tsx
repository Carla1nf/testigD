import { createMachine } from "xstate"

export const machine = createMachine(
  {
    id: "createOffer",
    initial: "form",
    states: {
      form: {
        description: "Form can be filled out in any order",
        states: {
          collateralToken1: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateral1: {
                    target: "selected",
                    guard: "ifValidToken",
                    actions: [
                      { type: "setCollateralToken1" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateral1: {
                    target: "selected",
                    guard: "ifValidToken",
                    actions: [
                      { type: "setCollateralToken1" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
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
                    guard: "ifValidToken",
                    actions: [
                      { type: "setToken" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  token: {
                    target: "selected",
                    guard: "ifValidToken",
                    actions: [
                      { type: "setToken" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
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
                    actions: [{ type: "setNumberOfPayments" }, { type: "validateForm" }],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
              hasValue: {
                on: {
                  numberOfPayments: {
                    target: "hasValue",
                    guard: "isValidNumberOfPayments",
                    actions: [{ type: "setNumberOfPayments" }, { type: "validateForm" }],
                    description: "Must be an integer value between 0 and 10",
                  },
                },
              },
            },
          },
          history: {},
          collateralToken0: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralToken0: {
                    target: "selected",
                    guard: "ifValidToken",
                    actions: [
                      { type: "setCollateralToken0" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
              selected: {
                on: {
                  collateralToken0: {
                    target: "selected",
                    guard: "ifValidToken",
                    actions: [
                      { type: "setCollateralToken0" },
                      { type: "updateLTV" },
                      { type: "updateChartValues" },
                      { type: "validateForm" },
                    ],
                    description: "event must contain a valid token",
                  },
                },
              },
            },
          },
          collateralValue0: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralValue0: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setCollateralValue0" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralValue0: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setCollateralValue0" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
          collateralValue1: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  collateralValue1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setCollateralValue1" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  collateralValue1: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setCollateralValue1" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
          tokenValue: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  tokenValue: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setTokenValue" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
              hasValue: {
                on: {
                  tokenValue: {
                    target: "hasValue",
                    guard: "isNonNegativeInteger",
                    actions: [{ type: "setTokenValue" }, { type: "updateLTV" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
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
                    actions: [{ type: "setDurationDays" }, { type: "validateForm" }],
                    description: "Must be an integer between 0 and 365",
                  },
                },
              },
              hasValue: {
                on: {
                  durationDays: {
                    target: "hasValue",
                    guard: "isValidDurationDays",
                    actions: [{ type: "setDurationDays" }, { type: "validateForm" }],
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
                    actions: [{ type: "setInterestPercent" }, { type: "validateForm" }],
                    description: "Must be an integer value 0 or above",
                  },
                },
              },
            },
          },
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
    types: {
      events: {} as
        | { type: "back" }
        | { type: "next" }
        | { type: "retry" }
        | { type: "token" }
        | { type: "confirm" }
        | { type: "tokenValue" }
        | { type: "collateral1" }
        | { type: "durationDays" }
        | { type: "interestPercent" }
        | { type: "collateralToken0" }
        | { type: "collateralValue0" }
        | { type: "collateralValue1" }
        | { type: "numberOfPayments" },
    },
  },
  {
    actions: {
      setCollateralToken1: ({ context, event }) => {},
      updateLTV: ({ context, event }) => {},
      updateChartValues: ({ context, event }) => {},
      setToken: ({ context, event }) => {},
      setCollateralToken0: ({ context, event }) => {},
      setCollateralValue0: ({ context, event }) => {},
      setCollateralValue1: ({ context, event }) => {},
      setTokenValue: ({ context, event }) => {},
      setNumberOfPayments: ({ context, event }) => {},
      validateForm: ({ context, event }) => {},
      setDurationDays: ({ context, event }) => {},
      setInterestPercent: ({ context, event }) => {},
    },
    actors: {
      createOffer: createMachine({
        /* ... */
      }),
    },
    guards: {
      isFormComplete: ({ context, event }, params) => {
        return false
      },
      ifValidToken: ({ context, event }, params) => {
        return false
      },
      isNonNegativeInteger: ({ context, event }, params) => {
        return false
      },
      isValidNumberOfPayments: ({ context, event }, params) => {
        return false
      },
      isValidDurationDays: ({ context, event }, params) => {
        return false
      },
    },
    delays: {},
  }
)
