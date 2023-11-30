import { DEBITA_ADDRESS, OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { useContractRead } from "wagmi"
import debitaAbi from "../abis/debita.json"
import ownershipsAbi from "../abis/ownerships.json"

export const useLoanValues = (address: `0x${string}` | undefined, id: number) => {
  const { data: tokenOfOwnerByIndex } = useContractRead({
    address: OWNERSHIP_ADDRESS,
    abi: ownershipsAbi,
    functionName: "tokenOfOwnerByIndex",
    args: [address, id],
  })

  const { data: loansByNFt } = useContractRead({
    address: DEBITA_ADDRESS,
    abi: debitaAbi,
    functionName: "loansByNFt",
    args: [tokenOfOwnerByIndex ?? ""],
  })

  const { data: getLoansData } = useContractRead({
    address: DEBITA_ADDRESS,
    abi: debitaAbi,
    functionName: "getLOANS_DATA",
    args: [loansByNFt ?? ""],
  })

  const { data: claimableDebt } = useContractRead({
    address: DEBITA_ADDRESS,
    abi: debitaAbi,
    functionName: "claimeableDebt",
    // @ts-ignore
    args: [getLoansData?.LenderOwnerId ?? ""],
  })

  //   const name = getERC20(data != undefined ? data.LenderToken : "")
  //   const collateral_1 = getERC20(data != undefined ? data.collaterals[0] : "")
  //   const collateral_2 = getERC20(data != undefined ? data.collaterals[1] : "")

  return {
    claimableDebt,
    tokenOfOwnerByIndex,
    getLoansData,
    id,
    loansByNFt,
  }
}
