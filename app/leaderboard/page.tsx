"use client"

import DisplayToken from "@/components/ux/display-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { findInternalTokenByAddress } from "@/lib/tokens"

export default function LeaderBoardPage() {
  const currentChain = useCurrentChain()

  const token = findInternalTokenByAddress(currentChain.slug, "0x3Fd3A0c85B70754eFc07aC9Ac0cbBDCe664865A6")

  return (
    <div className="flex flex-col gap-12">
      <div className="flex md:flex-row flex-col gap-4">
        <div className="flex flex-col w-full">
          <div className="font-bold text-4xl text-gray-200">Leaderboard DBT</div>
          <div className="bg-clip-text  text-transparent bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-pink-400 via-pink-400 to-purple-400 font-bold text-lg">
            Season 1
          </div>
        </div>
        <div className=" w-full flex md:flex-row flex-col md:items-center gap-7 justify-end">
          <div className="bg-black/20  h-10 rounded flex items-center font-semibold gap-2 px-7">
            <div className="text-sm text-gray-400">Season bounties: </div>
            <div>12,000,000 DBT </div>
          </div>
          <div className="bg-black/20  h-10 rounded flex items-center font-semibold gap-2 px-7">
            <div className="text-sm text-gray-400">Time left:</div>
            <div>30d 20h 13m </div>
          </div>
        </div>
      </div>
      <div className="flex w-full gap-12">
        <div className="flex flex-col w-full gap-3 text-gray-200">
          <div className="flex h-10 items-center justify-between font-bold text-gray-500/80 border-b-2 border-neutral-500/20">
            <div className="w-full px-2">Wallet</div>
            <div className="w-full px-2">Points</div>
            <div className="w-full">Bounties</div>
          </div>
          <div className=" bg-pink-400/10 h-14 flex rounded-lg items-center  font-bold text-sm">
            <div className="w-full px-4 flex">1. 0x0d3...bf3d</div>
            <div className="w-full">438302</div>
            <div className="w-full">2,000,000 DBT</div>
          </div>
          <div className=" bg-purple-400/10 h-14 flex rounded-lg items-center  font-bold text-sm"></div>
          <div className=" bg-purple-400/10 h-14 rounded-lg"></div>
        </div>
        <div className="w-10/12">
          <div className="flex flex-col w-full gap-3 text-gray-200">
            <div className="flex h-10 items-center justify-between font-bold text-gray-500/80 border-b-2 border-neutral-500/20">
              <div className="w-full">Token</div>
              <div className="w-full">Lend</div>
              <div className="w-full">Borrow</div>
            </div>
            <div className="h-14 flex items-center">
              <div className="w-full ">
                {token ? <DisplayToken size={28} token={token} chainSlug={currentChain.slug} /> : null}
              </div>
              <div className="w-full font-semibold">x1.67</div>
              <div className="w-full font-semibold">x2.15</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
