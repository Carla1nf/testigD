"use client"

import { AvailableIcon, MarketSizeIcon, TotalLentIcon } from "@/components/icons"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLendingMarket } from "@/hooks/useLendingMarket"
import { useLendingMarketStats } from "@/hooks/useLendingMarketStats"
import { dollars } from "@/lib/display"
import { findInternalTokenByAddress } from "@/lib/tokens"
import { useRouter } from "next/navigation"

export default function Lend() {
  const stats = useLendingMarketStats()
  const { dividedOffers } = useLendingMarket()
  const currentChain = useCurrentChain()
  const router = useRouter()

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between mb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Lending Market</h1>
          <DisplayNetwork currentChain={currentChain} />
        </div>
        <div className="grid grid-cols-3 gap-12">
          <Stat
            value={dollars({ value: stats.available, decimals: 0 })}
            title={"Available"}
            Icon={<AvailableIcon className="w-10 h-10 fill-white" />}
          />
          <Stat
            value={dollars({ value: stats.marketSize, decimals: 0 })}
            title={"Market Size"}
            Icon={<MarketSizeIcon className="w-10 h-10 fill-white" />}
          />
          <Stat
            value={dollars({ value: stats.totalLiquidityLent, decimals: 0 })}
            title={"Total Lent"}
            Icon={<TotalLentIcon className="w-10 h-10 fill-white" />}
          />
        </div>
      </div>

      {/* Render token table (top level)  */}
      <ShowWhenTrue when={!!dividedOffers && dividedOffers?.size > 0}>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white" suppressHydrationWarning>
            <tr
              className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left"
              suppressHydrationWarning
            >
              <th className="p-3 px-4 text-left">Lend</th>
              <th className="p-3 px-4 text-left">Offers</th>
              <th className="p-3 px-4 text-left">Liquidity Offers</th>
              <th className="p-3 px-4 text-left">Price</th>
              <th className="p-3 px-4 text-left">Interest (%)</th>
              <th className="p-3 px-4 text-left">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {Array.from(dividedOffers ?? [])?.map(([address, values]) => {
              const token = findInternalTokenByAddress(currentChain.slug, address)
              console.log("values", values)

              return (
                <tr
                  onClick={() => {
                    router.push(`/lend/${address}`)
                  }}
                >
                  <td className="p-2 text-left px-4 items-center">
                    {token ? <DisplayToken size={28} token={token} /> : null}
                  </td>
                  <td className="p-2 text-left px-4 items-center">{values.events.length}</td>
                  <td className="p-2 text-left px-4 items-center">{values.events.length}</td>
                  <td className="p-2 text-left px-4 items-center">{dollars({ value: values.price })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ShowWhenTrue>
    </>
  )
}
