"use client"

import { AvailableIcon, MarketSizeIcon, TotalLentIcon } from "@/components/icons"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import { useBorrowMarket } from "@/hooks/useBorrowMarket"
import { useBorrowingMarketStats } from "@/hooks/useBorrowingMarketStats"
import useCurrentChain from "@/hooks/useCurrentChain"
import { dollars, percent } from "@/lib/display"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

export default function Borrow() {
  const stats = useBorrowingMarketStats()
  const { offers } = useBorrowMarket()
  const currentChain = useCurrentChain()
  const router = useRouter()

  const breadcrumbs = useMemo(
    () => [<DisplayNetwork currentChain={currentChain} size={18} key="network" />],
    [currentChain]
  )

  return (
    <>
      {/* Page header */}
      <div className="@container mb-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="flex flex-col @4xl:flex-row gap-8 justify-between">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">Borrowing Market</h1>
          </div>
          <div className="grid grid-cols-3 gap-8">
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
      </div>

      {/* Render token table (top level)  */}
      <ShowWhenTrue when={Array.isArray(offers) && offers.length > 0}>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white" suppressHydrationWarning>
            <tr
              className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left"
              suppressHydrationWarning
            >
              <th className="p-3 px-4 text-left">Borrow</th>
              <th className="p-3 px-4 text-center">Offers</th>
              <th className="p-3 px-4 text-center">Liquidity Offers</th>
              <th className="p-3 px-4 text-center">Price</th>
              <th className="p-3 px-4 text-center">Avg Interest</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {offers?.map((offer: any) => {
              if (!offer.token) {
                return null
              }
              return (
                <tr
                  onClick={() => {
                    router.push(`/borrow/${offer.token.address}`)
                  }}
                  key={`${offer.token.symbol}_${offer.token.address}`}
                  className="hover:bg-[#383838] cursor-pointer"
                >
                  <td className="p-2 text-left px-4 items-center">
                    {offer.token ? <DisplayToken size={28} token={offer.token} /> : null}
                  </td>
                  <td className="p-2 text-center px-4 items-center">{offer.events.length}</td>
                  <td className="p-2 text-center px-4 items-center">{dollars({ value: offer.liquidityOffer })}</td>
                  <td className="p-2 text-center px-4 items-center">
                    {dollars({ value: offer?.price ?? 0, decimals: 2 })}
                  </td>
                  <td className="p-2 text-center px-4 items-center">
                    {percent({ value: offer.averageInterestRate, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ShowWhenTrue>
    </>
  )
}
