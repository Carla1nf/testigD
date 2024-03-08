"use client"

import { HourGlassIcon, PriceIcon } from "@/components/icons"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLendingMarket } from "@/hooks/useLendingMarket"
import { useOffer } from "@/hooks/useOffer"
import { useSpecificLendingMarketStats } from "@/hooks/useSpecificLendingMarketStats"
import { dollars, ltv, percent } from "@/lib/display"
import { filterOffersByToken } from "@/lib/filters"
import { Token, findInternalTokenByAddress } from "@/lib/tokens"
import { PercentIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

export default function SpecificLend({ params }: { params: { token: string } }) {
  const currentChain = useCurrentChain()
  const stats = useSpecificLendingMarketStats(params.token)
  const token = findInternalTokenByAddress(currentChain.slug, params.token)
  const { offers } = useLendingMarket()
  const marketOffers = token ? filterOffersByToken(offers, token) : []
  const events = Array.isArray(marketOffers) && marketOffers.length > 0 ? marketOffers[0].events : []

  const breadcrumbs = useMemo(
    () => [
      <DisplayNetwork currentChain={currentChain} size={18} key="network" />,
      <Link href={`/lend/`} className="hover:text-white/75" key="lending-market">
        Lending Market
      </Link>,
    ],
    [currentChain]
  )

  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 lg:mb-16">
        <Breadcrumbs items={breadcrumbs} />
        <div className="flex flex-col @6xl:flex-row gap-8 justify-between items-center">
          {/* Page title */}
          <div className="space-y-2 flex-row justify-center">
            <h1 className="text-3xl font-bold flex flex-row gap-2 items-center whitespace-nowrap">
              Lending{" "}
              {token ? (
                <DisplayToken
                  size={28}
                  token={token}
                  className="flex-row-reverse gap-1"
                  chainSlug={currentChain.slug}
                />
              ) : null}
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <Stat
              value={dollars({ value: stats.price, decimals: 3 })}
              title={"Price"}
              Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
            />
            <Stat
              value={dollars({ value: stats.waitingToBeLent })}
              title={"Available liquidity"}
              titleSmall={"Available"}
              Icon={<HourGlassIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
            />
            <Stat
              value={percent({ value: stats.mediumInterest / 10, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
              title={"Medium Interest %"}
              titleSmall={"Avg Int %"}
              Icon={<PercentIcon className="w-6 h-6 md:w-10 md:h-10" />}
            />
          </div>
        </div>
      </div>

      {/* Render token table (secondary level - specific token selected)  */}
      <ShowWhenTrue when={Array.isArray(marketOffers) && marketOffers.length > 0}>
        <table
          className="w-full flex flex-col flex-no-wrap rounded-lg overflow-hidden md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white text-sm" suppressHydrationWarning>
            <tr
              className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left  font-bold text-gray-500/80 border-b-2 border-neutral-500/20"
              suppressHydrationWarning
            >
              <th className="p-3 md:text-left text-center">Lend</th>
              <th className="p-3 md:text-left text-center">Collateral</th>
              <th className="p-3 text-center">LTV</th>
              {/* <th className="p-3 text-center">Lending amt.</th>
              <th className="p-3 text-center">Collateral amt.</th> */}
              <th className="p-3 text-center">Time</th>
              <th className="p-3 text-center">Payments</th>
              <th className="p-3 text-center">Interest (%)</th>
              <th className="p-3 text-center">Effective APR (%)</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {events?.map((event: any, index: number) => {
              return <TableRow event={event} token={token} key={event.address} _index={index} />
            })}
          </tbody>
        </table>
      </ShowWhenTrue>
    </>
  )
}

const TableRow = ({ event, token, _index }: { event: any; token?: Token; _index: number }) => {
  const router = useRouter()
  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: offer } = useOffer(address, event.address)
  const collateral = offer?.collateral
  const collateralToken = collateral?.token

  return (
    <ShowWhenTrue when={offer != undefined && offer?.principle.amount > 0}>
      <tr
        onClick={() => {
          router.push(`/borrow-offer/${event.address}`)
        }}
        key={`${offer?.principle?.token?.symbol}_${event.address}`}
        className={` ${
          _index % 2 == 1 ? "" : "bg-stone-500/5"
        } hover:bg-slate-500/10 cursor-pointer animate-enter-token border-b border-[#383838]/50`}
      >
        <td className="p-4 text-left">
          {token ? (
            <DisplayToken size={28} token={token} amount={offer?.principle.amount} chainSlug={currentChain.slug} />
          ) : null}
        </td>
        <td className="p-4 text-left">
          <div className="flex flex-col gap-2">
            {collateralToken ? (
              <DisplayToken
                size={28}
                token={collateralToken}
                amount={collateral?.amount}
                chainSlug={currentChain.slug}
              />
            ) : (
              <div className="animate-pulse flex space-x-4">
                <div className=" bg-debitaPink/80 h-3 w-28 rounded"></div>
              </div>
            )}
          </div>
        </td>
        <td className="p-4 text-center">{ltv(Number(offer?.ltv))}</td>
        <td className="p-4 text-center">{offer?.numberOfLoanDays} Days</td>
        <td className="p-4 text-center ">{Number(offer?.paymentCount ?? 0)}</td>
        <td className="p-3 text-center">
          {percent({ value: offer?.interest ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
        </td>
        <td className="p-3 text-center">
          {percent({ value: offer?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
        </td>
      </tr>
    </ShowWhenTrue>
  )
}
