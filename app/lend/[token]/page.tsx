"use client"

import { HourGlassIcon, PriceIcon } from "@/components/icons"
import BackLink from "@/components/ux/back-link"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLendingMarket } from "@/hooks/useLendingMarket"
import { useOfferCollateralData } from "@/hooks/useOfferCollateralData"
import { useSpecificLendingMarketStats } from "@/hooks/useSpecificLendingMarketStats"
import { dollars } from "@/lib/display"
import { Token, findInternalTokenByAddress } from "@/lib/tokens"
import { PercentIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Address } from "viem"

export default function SpecificLend({ params }: { params: { token: string } }) {
  const { address } = useControlledAddress()
  const currentChain = useCurrentChain()

  const stats = useSpecificLendingMarketStats(params.token)
  const token = findInternalTokenByAddress(currentChain.slug, params.token)
  const { dividedOffers } = useLendingMarket()

  // Get the divided offers for this specific token (specificDividedOffers.events)
  const specificDividedOffers = useMemo(() => {
    if (!dividedOffers) return undefined
    return dividedOffers.get(params.token)
  }, [dividedOffers, params.token])

  console.log("specificDividedOffers", specificDividedOffers)

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-bold flex flex-row gap-2 items-center">
              {token ? <DisplayToken size={28} token={token} /> : null}
              Lending Market
            </h1>
            <BackLink />
          </div>
          <DisplayNetwork currentChain={currentChain} />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Stat
            value={dollars({ value: stats.price, decimals: 3 })}
            title={"Price"}
            Icon={<PriceIcon className="w-10 h-10 fill-white" />}
          />
          <Stat
            value={dollars({ value: stats.waitingToBeLent })}
            title={"Wating to be lent"}
            Icon={<HourGlassIcon className="w-10 h-10 fill-white" />}
          />
          <Stat
            value={dollars({ value: stats.mediumInterest })}
            title={"Mediium Interest %"}
            Icon={<PercentIcon className="w-10 h-10" />}
          />
        </div>
      </div>

      {/* Render token table (secondary level - specific token selected)  */}
      <ShowWhenTrue when={!!specificDividedOffers && specificDividedOffers?.events?.length > 0}>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white" suppressHydrationWarning>
            <tr
              className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left"
              suppressHydrationWarning
            >
              <th className="p-3 text-left">Lend</th>
              <th className="p-3 text-left">Collateral</th>
              <th className="p-3 text-left">LTV</th>
              <th className="p-3 text-left">Lending amt.</th>
              <th className="p-3 text-left">Collateral amt.</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Payments</th>
              <th className="p-3 text-left">Interest (%)</th>
              <th className="p-3 text-left">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {specificDividedOffers?.events.map((event) => {
              return <TableRow event={event} token={token} />
            })}
          </tbody>
        </table>
      </ShowWhenTrue>
    </>
  )
}

// I Really dislike this pattern, we are fetching data during rendering
// I would much prefer if the data xcan be pre-fetched aso the cache is primed
// Thisd will result in a better experience for the user and for the devs, we currentlyhave knowldege spread out across the app
// I wonder if this is better suited in the API layer.
//
// For now, I am happy to go this route but ultimately, we can do better than this
//
// Let's get ALL of the logic converted from V1 and then we can refactor

const TableRow = ({ event, token }: { event: any; token?: Token }) => {
  const { address } = useControlledAddress()
  const currentChain = useCurrentChain()
  const router = useRouter()
  const { data: collateralData } = useOfferCollateralData(address, event.id)

  // const lenderToken = findInternalTokenByAddress(currentChain.slug, collateralData?.wantedLenderToken as Address)
  const collateralToken0 = findInternalTokenByAddress(currentChain.slug, collateralData?.collaterals[0] as Address)
  const collateralToken1 = findInternalTokenByAddress(currentChain.slug, collateralData?.collaterals[1] as Address)

  // const collateralToken = findInternalTokenByAddress(currentChain.slug, event.tokenAddress)
  console.log("values", event)

  return (
    <tr
      onClick={() => {
        router.push(`/borrow-offer/${event.id}`)
      }}
    >
      <td>{token ? <DisplayToken size={28} token={token} /> : null}</td>
      <td>
        {collateralToken0 ? <DisplayToken size={28} token={collateralToken0} /> : null}
        {collateralToken1 ? <DisplayToken size={28} token={collateralToken1} /> : null}
      </td>
    </tr>
  )
}
