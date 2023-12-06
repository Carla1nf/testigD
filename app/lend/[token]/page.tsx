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
import { dollars, percent, timelapDays, toDays } from "@/lib/display"
import { fromDecimals } from "@/lib/erc20"
import { Token, findInternalTokenByAddress } from "@/lib/tokens"
import { PercentIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Address } from "viem"

export default function SpecificLend({ params }: { params: { token: string } }) {
  const currentChain = useCurrentChain()
  const stats = useSpecificLendingMarketStats(params.token)
  const token = findInternalTokenByAddress(currentChain.slug, params.token)
  const { dividedOffers } = useLendingMarket()

  // Get the divided offers for this specific token (specificDividedOffers.events)
  const specificDividedOffers = dividedOffers?.get(params.token) ?? undefined

  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 lg:mb-16">
        <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
          {/* Mobile / tablet view */}
          <div className="space-y-2 @6xl:hidden">
            <h1 className="text-2xl font-bold flex flex-row  gap-2 items-center whitespace-nowrap">
              {token ? <DisplayToken size={28} token={token} /> : null}
              Lending Market
            </h1>
            <div className="flex flex-row items-center justify-between gap-8">
              <DisplayNetwork currentChain={currentChain} />
              <BackLink />
            </div>
          </div>
          {/* Desktop view */}
          <div className="space-y-2 hidden @6xl:flex flex-col justify-center">
            <div className="flex items-center justify-between gap-8">
              <h1 className="text-3xl font-bold flex flex-row  gap-2 items-center whitespace-nowrap">
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
              Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
            />
            <Stat
              value={dollars({ value: stats.waitingToBeLent })}
              title={"Waiting to be lent"}
              titleSmall={"Available"}
              Icon={<HourGlassIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
            />
            <Stat
              value={percent({ value: stats.mediumInterest, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
              title={"Medium Interest %"}
              titleSmall={"Avg Int %"}
              Icon={<PercentIcon className="w-6 h-6 md:w-10 md:h-10" />}
            />
          </div>
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
              <th className="p-3 text-center">LTV</th>
              <th className="p-3 text-center">Lending amt.</th>
              <th className="p-3 text-center">Collateral amt.</th>
              <th className="p-3 text-center">Time</th>
              <th className="p-3 text-center">Payments</th>
              <th className="p-3 text-center">Interest (%)</th>
              <th className="p-3 text-left">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {specificDividedOffers?.events.map((event) => {
              return <TableRow event={event} token={token} key={event.id} />
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

  const lenderToken = findInternalTokenByAddress(currentChain.slug, collateralData?.wantedLenderToken as Address)
  const collateralToken0 = findInternalTokenByAddress(currentChain.slug, collateralData?.collaterals[0] as Address)
  const collateralToken1 = findInternalTokenByAddress(currentChain.slug, collateralData?.collaterals[1] as Address)

  // const collateralToken = findInternalTokenByAddress(currentChain.slug, event.tokenAddress)
  // console.log("TableRow->event", event)
  // console.log("TableRow->collateralData", collateralData)

  return (
    <tr
      onClick={() => {
        router.push(`/borrow-offer/${event.id}`)
      }}
      key={`${lenderToken?.symbol}_${event.id}`}
    >
      <td className="p-3 text-left">{token ? <DisplayToken size={28} token={token} /> : null}</td>
      <td className="p-3 text-left">
        <div className="flex flex-col gap-2">
          {collateralToken0 ? <DisplayToken size={28} token={collateralToken0} /> : null}
          {collateralToken1 ? <DisplayToken size={28} token={collateralToken1} /> : null}
        </div>
      </td>

      <td className="p-3 text-center">-</td>

      <td className="p-3 text-center ">
        <div>
          {event.lendingAmount} {lenderToken?.symbol}
        </div>
      </td>
      <td className="p-3 text-center">
        <div className="flex flex-col gap-2">
          {collateralToken0 ? (
            <div>
              {fromDecimals((collateralData?.collateralAmount[0] as bigint) ?? 0, collateralToken0.decimals)}{" "}
              {collateralToken0?.symbol}
            </div>
          ) : null}
          {collateralToken1 ? (
            <div>
              {fromDecimals((collateralData?.collateralAmount[1] as bigint) ?? 0, collateralToken1.decimals)}{" "}
              {collateralToken1?.symbol}
            </div>
          ) : null}
        </div>
      </td>
      <td className="p-3 text-center">{timelapDays(Number(collateralData?.timelap))} Days</td>
      <td className="p-3 text-center">{Number(collateralData?.paymentCount ?? 0)}</td>
      <td className="p-3 text-center">
        {percent({ value: event?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
      <td className="p-3 text-left">n/a</td>
    </tr>
  )
}
