// import { MARKET_MAKING_WALLET } from "@/lib/addresses"
import { Address, Connector, useAccount } from "wagmi"

export const useControlledAddress = (): { address: Address | undefined; connector: Connector | undefined } => {
  const { address, connector } = useAccount()

  // when in dev mode we can return the market making address to
  // return { address: MARKET_MAKING_WALLET }

  return { address, connector }
}
