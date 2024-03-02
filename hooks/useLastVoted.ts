import { readContract } from "wagmi/actions"
import voterABI from "../abis/v2/Voter.json"
import { Address } from "viem"
import { useContractRead } from "wagmi"

export const useLastVoted = ({
  voterAddress,
  veNFTID,
}: {
  voterAddress: `0x${string}` | undefined
  veNFTID: number
}) => {
  console.log(voterAddress, "voter")
  const lastVotedTime = useContractRead({
    address: voterAddress as Address,
    abi: voterABI,
    functionName: "lastVoted",
    args: [veNFTID ?? 0],
  })
  if (lastVotedTime.isSuccess) {
    return { lastVoted: Number(lastVotedTime.data) }
  }
  return { lastVoted: 0 }
}
