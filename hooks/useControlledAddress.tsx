// import { MARKET_MAKING_WALLET } from "@/lib/addresses"
import { Address, useAccount } from "wagmi"

export const useControlledAddress = (): { address: Address | undefined } => {
  const { address } = useAccount()

  // when in dev mode we can return the market making address to
  // return { address: MARKET_MAKING_WALLET }

  return { address }
}
