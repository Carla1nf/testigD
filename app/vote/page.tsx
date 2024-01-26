"use client"
import SelectVoteLoan from "@/components/select-vote-loan"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLoanValues } from "@/hooks/useLoanValues"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import { range } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Address, useConfig } from "wagmi"
import createdLoanABI from "@/abis/v2/createdLoan.json"
import { writeContract } from "wagmi/actions"
import VeEqualVotingTable from "./veequal-voting-table"

export default function VotePage({ params }: { params: { loanAddress: string } }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const config = useConfig()
  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { ownershipBalance } = useOwnershipBalance(address)
  const { isSuccess, isLoading, isError, data } = useLoanValues(address as Address, selectedIndex, "Borrowed")

  const indexes = useMemo(() => {
    return range(ownershipBalance)
  }, [ownershipBalance])

  // _voteWithVe(address[] calldata _poolVote, uint256[] calldata _weights)
  const voteWith = async () => {
    const { request } = await config.publicClient.simulateContract({
      address: data?.loan.address as Address,
      functionName: "_voteWithVe",
      abi: createdLoanABI,
      args: [[], []],
      account: address,
      gas: BigInt(300000),
    })

    const result = await writeContract(request)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-2xl">Vote</div>
      <div className="font-bold text-sm text-gray-400">Use your veNFT as collateral to vote</div>
      <div className="flex gap-3 mt-12">
        <div className="flex flex-col w-full">
          <div className="flex flex-col flex-no wrap sm:table-row rounded-t-xl mb-2 sm:mb-0 text-left text-white opacity-60 font-medium text-sm bg-black w-full p-3">
            Select collateral to vote{" "}
          </div>
          <div className="flex-1 sm:flex-none">
            {indexes.map((index: number) => {
              return <SelectVoteLoan address={address as Address} index={index} key={index} />
            })}
          </div>
        </div>

        <ShowWhenTrue when={selectedIndex == 0}>
          <div className="w-full flex items-center justify-center text-neutral-500">Please select a collateral</div>
        </ShowWhenTrue>

        <ShowWhenTrue when={selectedIndex != 0}>
          <div
            className="w-full flex flex-col items-center justify-center animate-enter-token"
            onClick={() => voteWith()}
          >
            <div className="bg-debitaPink px-10 py-1 rounded font-bold cursor-pointer hover:scale-[1.03]">Vote</div>
          </div>
        </ShowWhenTrue>
      </div>
      <div className="w-full mt-16">
        <VeEqualVotingTable />
      </div>
    </div>
  )
}
