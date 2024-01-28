"use client"

import { useDebitaDataQuery } from "@/services/queries"
import { Token } from "./tokens"

export const getPoints = ({
  token,
  loanValue,
  isBorrowMode,
}: {
  token?: Token
  loanValue: number
  isBorrowMode: boolean
}) => {
  const { data, isSuccess } = useDebitaDataQuery()
  let multiplier = 100
  data?.pointsPerToken.map((array) => {
    if (array[0] == token?.address) {
      multiplier = isBorrowMode ? Number(array[2]) : Number(array[1])
    }
  })
  console.log(data)
  return (multiplier * loanValue).toFixed(2)
}

export const pointsBorrow = ({
  totalPointsAvailable,
  amountToBorrow,
  totalPrincipleAmount,
}: {
  totalPointsAvailable: number
  amountToBorrow: number
  totalPrincipleAmount: number
}) => {
  return ((Number(totalPointsAvailable) * amountToBorrow) / totalPrincipleAmount).toFixed(2)
}
