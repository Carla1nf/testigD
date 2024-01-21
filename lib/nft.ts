import { Address, PublicClient } from "viem"
import { readContract, writeContract } from "wagmi/actions"
import veTokenAbi from "@/abis/v2/veToken.json"

export const isVeTokenApprovedOrOwner = async ({
  veToken,
  spender,
  nftId,
}: {
  veToken: Address
  spender: Address
  nftId: bigint
}) => {
  const hasPermissions = await readContract({
    address: veToken,
    functionName: "isApprovedOrOwner",
    abi: veTokenAbi,
    args: [spender, nftId],
  })
  return Boolean(hasPermissions)
}

export const approveVeToken = async ({
  veToken,
  spender,
  account,
  nftId,
  publicClient,
}: {
  veToken: Address
  spender: Address
  account: Address
  nftId: bigint
  publicClient: PublicClient
}) => {
  const { request } = await publicClient.simulateContract({
    address: veToken,
    functionName: "approve",
    abi: veTokenAbi,
    args: [spender, nftId],
    account,
  })

  console.log("")
  console.log("approveVeToken")
  console.log("veToken", veToken)
  console.log("[spender, nftId]", [spender, nftId])
  const executed = await writeContract(request)
  console.log("executed", executed)
  const transaction = await publicClient.waitForTransactionReceipt(executed)
  console.log("transaction", transaction)
  console.log("")

  return Promise.resolve(executed)
}
