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
import { writeContract } from "wagmi/actions"
import VeEqualVotingTable from "./veequal-voting-table"

export default function VotePage({ params }: { params: { loanAddress: string } }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const { address } = useControlledAddress()
  const { ownershipBalance } = useOwnershipBalance(address)

  const indexes = useMemo(() => {
    return range(ownershipBalance)
  }, [ownershipBalance])

  // _voteWithVe(address[] calldata _poolVote, uint256[] calldata _weights)

  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-2xl">Vote</div>
      <div className="font-bold text-sm text-gray-400">Use your veNFT as collateral to vote</div>
      <div className="flex gap-3 mt-12">
        <div className="flex flex-col w-full">
          <div className="flex flex-col flex-no wrap sm:table-row rounded-t-xl mb-2 sm:mb-0 text-left text-gray-400 opacity-60 font-medium text-sm bg-black w-full p-3">
            Select collateral to vote{" "}
          </div>
          <div className="flex-1 sm:flex-none">
            {indexes.map((index: number) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    index == selectedIndex ? setSelectedIndex(null) : setSelectedIndex(index)
                  }}
                >
                  <SelectVoteLoan address={address as Address} index={index} key={index} selected={selectedIndex} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="w-full mt-16">
        <VeEqualVotingTable selectedIndex={selectedIndex} address={address} />
      </div>
    </div>
  )
}
