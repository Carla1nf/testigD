import { Token } from "@/lib/tokens"
import { Address, formatUnits } from "viem"
import { readContract } from "wagmi/actions"
import veTokenInfoLensAbi from "../abis/v2/veTokenInfoLens.json"
import { useQuery } from "@tanstack/react-query"

type VeTokenInfoIncoming = {
  id: bigint
  amount: bigint
  voted: boolean
}

type VeTokenInfo = {
  id: number
  amountRaw: bigint
  amount: number
  voted: boolean
}

export type UserNftInfo = VeTokenInfo

const useNftInfo = ({ address, token }: { address?: Address; token?: Token }): UserNftInfo[] => {
  const { data } = useQuery({
    queryKey: ["user-nft-info", address, token?.nft?.infoLens],
    queryFn: async () => {
      if (!address || !token?.nft?.infoLens) {
        return []
      }
      if (token?.nft?.infoLensType !== "VeToken") {
        return []
      }
      const values = (await readContract({
        address: token?.nft?.infoLens as Address,
        abi: veTokenInfoLensAbi,
        functionName: "getDataFrom",
        args: [address],
      })) as VeTokenInfoIncoming[]

      return values.map((item) => {
        const amount = formatUnits(item.amount, token.decimals)
        return {
          id: Number(item.id),
          amountRaw: item.amount,
          amount: Number(amount),
          voted: Boolean(item.voted),
        }
      })
    },
  })

  return data ?? []
}

export default useNftInfo
