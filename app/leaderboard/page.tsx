"use client"

import { ShowWhenFalse } from "@/components/ux/conditionals"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token, findInternalTokenByAddress, getAllTokens } from "@/lib/tokens"
import { useDebitaDataQuery } from "@/services/queries"

export default function LeaderBoardPage() {
  const { data, isSuccess } = useDebitaDataQuery()
  const currentChain = useCurrentChain()

  const getToken = (address: string): Token => {
    const token = findInternalTokenByAddress(currentChain.slug, address)
    return token ? token : getAllTokens(currentChain.slug)[0]
  }

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
          <Stat value={"30d 20h 13m"} title={"Time left"} Icon={null} />
          <Stat value={`${data?.pointsPerAddress.length}`} title={"Active wallets"} Icon={null} />
        </div>
      </div>
      <div className="flex w-full  md:flex-row flex-col gap-12">
        <div className="flex flex-col w-full gap-2 text-gray-200">
          <div className="flex h-10 items-center justify-between font-bold text-gray-400 border-b-2 border-neutral-500/20 bg-black rounded">
            <div className="w-full px-2">Wallet</div>
            <div className="w-full px-2">Points</div>
          </div>
          {data?.pointsPerAddress.map((item, index) => {
            return (
              <>
                <ShowWhenFalse when={index == 0}>
                  <div
                    key={index}
                    className={`${
                      index % 2 == 0 ? "" : "bg-stone-500/5"
                    }  h-10 flex animate-enter-token rounded items-center   text-sm`}
                  >
                    <div className="w-full px-4 flex gap-3">
                      <div className="text-gray-400"> {index}.</div>{" "}
                      {`${item[0].substring(0, 5)}...${item[0].substring(38)}`}
                    </div>
                    <div className="w-full font-bold">{item[1]}</div>
                  </div>
                </ShowWhenFalse>
              </>
            )
          })}
        </div>
        <div className="w-10/12">
          <div className="flex flex-col w-full gap-2 text-gray-200">
            <div className="flex h-10 items-center justify-between font-bold text-gray-500/80 border-b-2 border-neutral-500/20">
              <div className="w-full">Token</div>
              <div className="w-full">Lend</div>
              <div className="w-full">Borrow</div>
            </div>
            {data?.pointsPerToken.map((item, index) => {
              const token = getToken(item[0])
              return (
                <div className="h-10 flex items-center" key={token.address}>
                  <div className="w-full ">
                    <DisplayToken size={28} token={token} chainSlug={currentChain.slug} />
                  </div>
                  <div className="w-full font-semibold">x{(Number(item[1]) / 100).toFixed(2)}</div>
                  <div className="w-full font-semibold">x{(Number(item[2]) / 100).toFixed(2)}</div>
                </div>
              )
            })}

            <div className="h-10 flex items-center">
              <div className="w-full flex gap-2 items-center">
                <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
                <div>Others</div>
              </div>
              <div className="w-full font-semibold">x1.00</div>
              <div className="w-full font-semibold">x1.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
