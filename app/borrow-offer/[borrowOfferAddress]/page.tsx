"use client"

import { useControlledAddress } from "@/hooks/useControlledAddress"
import { useOffer } from "@/hooks/useOffer"
import { Address } from "wagmi"
import BorrowOfferIsNotOwner from "./borrow-offer-is-not-owner"
import BorrowOfferIsOwner from "./borrow-offer-is-owner"

export default function BorrowOffer({ params }: { params: { borrowOfferAddress: Address } }) {
  const borrowOfferAddress = params.borrowOfferAddress
  const { address } = useControlledAddress()
  const { data: offer } = useOffer(address, borrowOfferAddress)

  const isOwnerConnected = address === offer?.owner

  if (isOwnerConnected) {
    return <BorrowOfferIsOwner params={params} />
  }

  return <BorrowOfferIsNotOwner params={params} />
}
