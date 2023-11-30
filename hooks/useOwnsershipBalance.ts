import { OWNERSHIP_ADDRESS } from "@/lib/contracts"
import { useContractRead } from "wagmi"
import ownershipsAbi from "../abis/ownerships.json"

export const useOwnershipBalance = (address: `0x${string}` | undefined) => {
  const query = useContractRead({
    address: OWNERSHIP_ADDRESS,
    abi: ownershipsAbi,
    functionName: "balanceOf",
    args: [address],
  })

  if (query.isSuccess) {
    return { query, ownershipBalance: Number(query.data) }
  }

  return { query, ownershipBalance: 0 }
}
