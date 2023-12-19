import { filterOffersByToken } from "@/lib/filters"
import { findInternalTokenByAddress } from "@/lib/tokens"
import { useEffect, useState } from "react"
import { Address } from "viem"
import useCurrentChain from "./useCurrentChain"
import { useBorrowMarket } from "./useBorrowMarket"

export const useSpecificBorrowMarketStats = (address: string) => {
  const [mediumInterest, setMediumInterest] = useState(0)
  const [price, setPrice] = useState(0)
  const [waitingToBeLent, setWaitingToBeLent] = useState(0)
  const { offers } = useBorrowMarket()
  const currentChain = useCurrentChain()
  const token = findInternalTokenByAddress(currentChain.slug, address as Address)

  useEffect(() => {
    const filtered = token ? filterOffersByToken(offers, token) : []
    const offer = Array.isArray(filtered) && filtered.length > 0 ? filtered[0] : undefined
    setPrice(offer?.price ?? 0)
    setWaitingToBeLent(offer?.liquidityOffer ?? 0)
    setMediumInterest(offer?.averageInterestRate ?? 0)
  }, [address, offers, token])

  return {
    price,
    waitingToBeLent,
    mediumInterest,
  }
}
