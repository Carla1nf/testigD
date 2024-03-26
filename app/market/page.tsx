"use client"

import { ShowWhenFalse, ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayToken from "@/components/ux/display-token"
import { useBorrowMarket } from "@/hooks/useBorrowMarket"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLendingMarket } from "@/hooks/useLendingMarket"
import { percent, timelapDays } from "@/lib/display"
import { Token, findTokenByAddress, getAllTokens } from "@/lib/tokens"
import { useDebitaDataQuery, useMarketDataQuery } from "@/services/queries"
import { useState } from "react"
import { Address, formatUnits } from "viem"
import { bigint } from "zod"

export default function MarketPage() {
  const { data } = useMarketDataQuery()
  const currentChain = useCurrentChain()
  const tokens = getAllTokens(currentChain.slug)
  // 0 --> All loans 1 --> Active loans 2 --> Inactive loans
  const [phase, setPhase] = useState(0)
  const [principle, setPrinciple] = useState<any>("")
  const [collateral, setCollateral] = useState<any>("")
  const [isPrincipleActive, setPrincipleActive] = useState(false)
  const [isCollateralActive, setCollateralActive] = useState(false)

  const handlePhase = () => {
    setPhase((prev) => (prev + 1) % 3)
  }

  return (
    <div className="">
      <div className=" text-3xl font-bold">Historical Loans</div>
      <div className=" text-base font-medium text-gray-500">View all historical loans of Debita v2</div>
      <div className="flex flex-col gap-10 justify-start items-start mt-4">
        <div className="flex md:flex-row flex-col gap-4 text-sm">
          <div className="bg-black rounded w-auto px-3 py-2 flex gap-2">
            <span className="text-gray-400 font-medium">Total loans:</span> {data?.length ?? 0}
          </div>

          <div className="bg-black rounded w-auto px-3 py-2 flex gap-2 relative">
            <span
              className="text-gray-400 font-medium cursor-pointer"
              onClick={() => setCollateralActive(!isCollateralActive)}
            >
              Collateral tokens:{" "}
            </span>{" "}
            {collateral == "" ? "All" : collateral?.symbol}
            <ShowWhenTrue when={isCollateralActive}>
              <div className="absolute flex flex-col gap-2 bg-black left-0 right-0 top-8 py-2 z-10">
                <div
                  className="cursor-pointer hover:bg-white/10 py-1 px-2"
                  onClick={() => {
                    setCollateral(""), setCollateralActive(false)
                  }}
                >
                  {" "}
                  All Tokens
                </div>
                {tokens.map((everyToken) => {
                  return (
                    <div
                      className="cursor-pointer hover:bg-white/10 py-1 px-2"
                      onClick={() => {
                        setCollateral(everyToken), setCollateralActive(false)
                      }}
                    >
                      {" "}
                      <DisplayToken token={everyToken as Token} size={20} />
                    </div>
                  )
                })}
              </div>
            </ShowWhenTrue>
          </div>

          <div className="bg-black rounded relative w-auto px-3 py-2 flex gap-2">
            <span
              className="text-gray-400 font-medium cursor-pointer"
              onClick={() => setPrincipleActive(!isPrincipleActive)}
            >
              Principle tokens:{" "}
            </span>{" "}
            {principle == "" ? "All" : principle?.symbol}
            <ShowWhenTrue when={isPrincipleActive}>
              <div className="absolute flex flex-col gap-2 bg-black left-0 right-0 top-8 py-2 z-10">
                <div
                  className="cursor-pointer hover:bg-white/10 py-1 px-2"
                  onClick={() => {
                    setPrinciple(""), setPrincipleActive(!isPrincipleActive)
                  }}
                >
                  {" "}
                  All Tokens
                </div>
                {tokens.map((everyToken) => {
                  return (
                    <div
                      className="cursor-pointer hover:bg-white/10 py-1 px-2"
                      onClick={() => {
                        setPrinciple(everyToken), setPrincipleActive(false)
                      }}
                    >
                      {" "}
                      <DisplayToken token={everyToken as Token} size={20} />
                    </div>
                  )
                })}
              </div>
            </ShowWhenTrue>
          </div>

          <div className="bg-black rounded w-auto px-3 py-2">
            {" "}
            <span className="text-gray-400 cursor-pointer font-medium" onClick={() => handlePhase()}>
              Showing:
              <ShowWhenTrue when={phase == 0}>
                <span className="text-gray-200"> Historical loans</span>
              </ShowWhenTrue>
              <ShowWhenTrue when={phase == 1}>
                <span className="text-green-200"> Active loans</span>
              </ShowWhenTrue>
              <ShowWhenTrue when={phase == 2}>
                <span className="text-red-200"> Closed loans</span>
              </ShowWhenTrue>
            </span>
          </div>
        </div>
        <div className="bg-black  w-full px-2 py-3 rounded">
          <table
            className="w-full flex flex-col flex-no-wrap  rounded-lg overflow-hidden md:inline-table"
            suppressHydrationWarning
          >
            <thead className="text-white text-sm" suppressHydrationWarning>
              <tr
                className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left   font-bold text-gray-500/80 border-b-2 border-neutral-500/20"
                suppressHydrationWarning
              >
                {/* <th>Loan ID</th> */}
                <th className="p-3 px-4 text-left">Collateral</th>
                <th className="p-3 px-4 text-center">Amount</th>
                <th className="p-3 px-4 text-left">Principle</th>
                <th className="p-3 px-4 text-center">Amount</th>
                <th className="p-3 px-4 text-center">Days</th>
                <th className="p-3 px-4 text-center">Interest</th>
                <th className="p-3 px-4 text-center">LTV</th>
              </tr>
            </thead>
            {data?.map((loan, index) => {
              const collateralToken = findTokenByAddress(currentChain.slug, loan?.collateralAddress as Address)
              const principleToken = findTokenByAddress(currentChain.slug, loan?.principleAddress as Address)

              return (
                <ShowWhenTrue
                  when={
                    (phase == 0 ||
                      (phase == 1 && loan.status == "Active") ||
                      (phase == 2 && loan.status == "Closed")) &&
                    (principle == "" || principle?.address == loan?.principleAddress) &&
                    (collateral == "" || collateral?.address == loan?.collateralAddress)
                  }
                >
                  <tr
                    key={loan.loanAddress}
                    className={` ${"bg-stone-200/10"} hover:bg-slate-300/10 rounded cursor-pointer animate-enter-token border-b-4 border-black`}
                  >
                    <td className="p-4 flex px-4 justify-start">
                      {collateralToken ? (
                        <DisplayToken size={22} token={collateralToken} chainSlug={currentChain.slug} />
                      ) : null}
                    </td>
                    <td className="p-4 text-center px-4 items-center">
                      {loan?.collateralAmount == "1" ? (
                        <span className="text-gray-500">No available data</span>
                      ) : (
                        Number(
                          formatUnits(BigInt(loan?.collateralAmount as string), collateralToken?.decimals as number)
                        ).toFixed(2)
                      )}{" "}
                      <ShowWhenFalse when={loan?.collateralAmount == "1"}>
                        <span className="text-gray-500">{collateralToken?.symbol}</span>
                      </ShowWhenFalse>
                    </td>
                    <td className="p-4 flex px-4 justify-start">
                      {" "}
                      {collateralToken ? (
                        <DisplayToken size={22} token={principleToken as Token} chainSlug={currentChain.slug} />
                      ) : null}
                    </td>
                    <td className="p-4 text-center px-4 items-center">
                      {" "}
                      {Number(
                        formatUnits(BigInt(loan?.principleAmount as string), principleToken?.decimals as number)
                      ).toFixed(2)}{" "}
                      <span className="text-gray-500">{principleToken?.symbol}</span>
                    </td>

                    <td className="p-4 text-center px-4 items-center">
                      {timelapDays(Number(loan?.duration))} <span className="text-gray-400">Days</span>
                    </td>
                    <td className="p-4 text-center px-4 items-center">
                      {`${(loan?.interest ?? 0) / 100}`} <span className="text-gray-400">%</span>
                    </td>
                    <td className="p-4 text-center px-4 items-center">{`${Number(loan?.ltv ?? 0).toFixed(2)}`}</td>
                  </tr>
                </ShowWhenTrue>
              )
            })}
          </table>
        </div>
      </div>
    </div>
  )
}
