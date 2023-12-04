"use client"

import { AvailableIcon, MarketSizeIcon, TotalLentIcon } from "@/components/icons"
import Stat from "@/components/ux/stat"
import TokenImage from "@/components/ux/token-image"
import { useLendingMarketStats } from "@/hooks/useLendingMarketStats"
import { dollars } from "@/lib/display"

export default function Lend() {
  const stats = useLendingMarketStats()
  return (
    <>
      <div className="flex justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Lending Market</h1>
          <div className="flex items-center text-sm font-bold gap-2 mb-8">
            <TokenImage width={20} height={20} symbol={"FTM"} chainSlug={"fantom"} />
            Fantom Network
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Stat
            value={dollars({ value: stats.available })}
            title={"Available"}
            Icon={<AvailableIcon className="w-10 h-10 fill-white" />}
          />
          <Stat
            value={dollars({ value: stats.marketSize })}
            title={"Market Size"}
            Icon={<MarketSizeIcon className="w-10 h-10 fill-white" />}
          />
          <Stat
            value={dollars({ value: stats.totalLiquidityLent })}
            title={"Total Lent"}
            Icon={<TotalLentIcon className="w-10 h-10 fill-white" />}
          />
        </div>
      </div>
    </>
  )
}
