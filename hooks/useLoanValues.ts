import { DEBITA_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { fromDecimals, tokenDecimals, tokenName } from "@/lib/erc20"
import { getAddress } from "viem"
import { Address, useContractRead } from "wagmi"
import debitaAbi from "../abis/debita.json"
import ownershipsAbi from "../abis/ownerships.json"

type Token = {
  name: string
  address?: Address
  amount: number
  decimals: number
  value?: number
}

type Collateral = {
  token: Token
}

type Loan = {
  id: number
  collaterals?: Collateral[]
  cooldown: bigint
  deadline: bigint
  deadlineNext: bigint
  executed: boolean
  lenderOwnerId: number
  paymentAmount: bigint
  paymentCount: bigint
  paymentsPaid: bigint
  timelap: bigint
  token: Token
}

export const useLoanValues = (address: `0x${string}` | undefined, index: number) => {
  const { data: ownerNftTokenId } = useContractRead({
    address: OWNERSHIP_ADDRESS,
    abi: ownershipsAbi,
    functionName: "tokenOfOwnerByIndex",
    args: [address, index],
  })

  const { data: loanId } = useContractRead({
    address: DEBITA_ADDRESS,
    abi: debitaAbi,
    functionName: "loansByNFt",
    args: [ownerNftTokenId ?? ""],
  })

  const { data: loanData } = useContractRead({
    address: DEBITA_ADDRESS,
    abi: debitaAbi,
    functionName: "getLOANS_DATA",
    args: [loanId ?? ""],
  }) as any

  // todo: parse the loanData through zod

  const { data: claimableDebt } = useContractRead({
    address: DEBITA_ADDRESS,
    abi: debitaAbi,
    functionName: "claimeableDebt",
    args: [loanData?.LenderOwnerId ?? ""],
  })

  // Process collateral into meaningful knowledge
  const collaterals = loanData.collaterals.map((collateral: Address, index: number) => {
    const safeAddress = getAddress(collateral)
    const amount = loanData?.collateralAmount[index] ?? 0
    const decimals = tokenDecimals({ address: safeAddress })
    const value = fromDecimals(amount, decimals)
    return {
      name: tokenName({ address: safeAddress }),
      address: safeAddress,
      amount,
      decimals,
      value,
    }
  })

  // Lets build the loan object as we want to see it
  const decimals = tokenDecimals({ address: loanData?.LenderToken })
  const amount = loanData?.LenderAmount
  const value = fromDecimals(amount, decimals)
  const { cooldown, deadline, deadlineNext, executed, paymentAmount, paymentCount, paymentsPaid, timelap } = loanData
  const loan: Loan = {
    id: index,
    collaterals,
    cooldown,
    deadline,
    deadlineNext,
    executed,
    lenderOwnerId: loanData?.LenderOwnerId,
    paymentAmount,
    paymentCount,
    paymentsPaid,
    timelap,
    token: {
      name: tokenName({ address: loanData?.LenderToken ?? "" }),
      address: loanData?.LenderToken,
      amount,
      decimals,
      value,
    },
  }

  return {
    claimableDebt,
    ownerNftTokenId,
    loan,
    loanId,
    loanData,
  }
}
