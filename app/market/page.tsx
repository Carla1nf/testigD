"use client"

import DisplayToken from "@/components/ux/display-token"
import { useBorrowMarket } from "@/hooks/useBorrowMarket"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLendingMarket } from "@/hooks/useLendingMarket"
import { percent, timelapDays } from "@/lib/display"
import { Token, findTokenByAddress } from "@/lib/tokens"
import { useDebitaDataQuery, useMarketDataQuery } from "@/services/queries"
import { Address } from "viem"

export default function MarketPage() {
  const { data } = useMarketDataQuery()
  const currentChain = useCurrentChain()

  return (
    <div className="">
      <div className=" text-3xl font-bold">Active Loans</div>
      <div className=" text-base font-medium text-gray-500">View all currently active loans</div>
      <div className="flex flex-col gap-10 justify-start items-start mt-4">
        <div className="flex gap-4 text-sm">
          <div className="bg-black rounded w-auto px-3 py-2 flex gap-2">
            <span className="text-gray-400 font-medium">Historical loans:</span> {data?.length ?? 0}
          </div>
          <div className="bg-black rounded w-auto px-3 py-2">
            {" "}
            <span className="text-gray-400 font-medium">Active loans:</span> 233
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
              </tr>
            </thead>
            {data?.map((loan, index) => {
              const collateralToken = findTokenByAddress(currentChain.slug, loan?.collateralAddress as Address)
              const principleToken = findTokenByAddress(currentChain.slug, loan?.principleAddress as Address)

              return (
                <tr
                  key={loan.loanAddress}
                  className={` ${
                    index % 2 == 1 ? "" : "bg-stone-500/5"
                  } hover:bg-slate-500/10 rounded cursor-pointer animate-enter-token border-b-2 border-gray-500/5`}
                >
                  <td className="p-4 flex px-4 justify-start">
                    {collateralToken ? (
                      <DisplayToken size={28} token={collateralToken} chainSlug={currentChain.slug} />
                    ) : null}
                  </td>
                  <td className="p-4 text-center px-4 items-center">{loan?.collateralAmount}</td>
                  <td className="p-4 flex px-4 justify-start">
                    {" "}
                    {collateralToken ? (
                      <DisplayToken size={28} token={principleToken as Token} chainSlug={currentChain.slug} />
                    ) : null}
                  </td>
                  <td className="p-4 text-center px-4 items-center">{loan?.principleAmount}</td>
                  <td className="p-4 text-center px-4 items-center">{timelapDays(Number(loan?.days))}</td>
                  <td className="p-4 text-center px-4 items-center">
                    {percent({ value: loan?.interest ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
                  </td>
                </tr>
              )
            })}
          </table>
        </div>
      </div>
    </div>
  )
}
