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
import { useOfferCollateralData } from "@/hooks/useOfferCollateralData"
import { useSpecificLendingMarketStats } from "@/hooks/useSpecificLendingMarketStats"
import { DEBITA_ADDRESS } from "@/lib/contracts"
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
              Lending {token ? <DisplayToken size={28} token={token} className="flex-row-reverse gap-1" /> : null}
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
      <ShowWhenTrue when={Array.isArray(marketOffers) && marketOffers.length > 0}>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white opacity-60 font-medium text-sm" suppressHydrationWarning>
            <tr
              className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left"
              suppressHydrationWarning
            >
              <th className="p-3 text-left">Lend</th>
              <th className="p-3 text-left">Collateral</th>
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
            {events?.map((event: any) => {
              return <TableRow event={event} token={token} key={event.address} />
            })}
          </tbody>
        </table>
      </ShowWhenTrue>
    </>
  )
}

const TableRow = ({ event, token }: { event: any; token?: Token }) => {
  const router = useRouter()
  const { address } = useControlledAddress()
  const { data: collateralData } = useOfferCollateralData(address, event.address)

  const collateral0 = collateralData?.collaterals[0]
  const collateral1 = collateralData?.collaterals[1]
  const collateralToken0 = collateral0?.token
  const collateralToken1 = collateral1?.token
  // const lenderToken = collateralData?.lender?.token

  return (
    <tr
      onClick={() => {
        router.push(`/borrow-offer/${event.address}`)
      }}
      key={`${collateralData?.lender?.token?.symbol}_${event.address}`}
      className="hover:bg-[#383838] cursor-pointer animate-enter-token border-b border-[#383838]/50"
    >
      <td className="p-4 text-left">
        {token ? <DisplayToken size={28} token={token} amount={event.lendingAmount} /> : null}
      </td>
      <td className="p-4 text-left">
        <div className="flex flex-col gap-2">
          {collateralToken0 ? (
            <DisplayToken size={28} token={collateralToken0} amount={collateral0.amount} />
          ) : (
            <div className="animate-pulse flex space-x-4">
              <div className=" bg-debitaPink/80 h-3 w-28 rounded"></div>
            </div>
          )}
          {collateralToken1 ? <DisplayToken size={28} token={collateralToken1} amount={collateral1.amount} /> : null}
        </div>
      </td>

      <td className="p-4 text-center">{ltv(collateralData?.ltv)}</td>
      {/* <td className="p-4 text-center ">
        <div>
          {event.lendingAmount} {lenderToken?.symbol}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex flex-col gap-2">
          {collateralToken0 ? (
            <div>
              {collateral0.amount} {collateralToken0?.symbol}
            </div>
          ) : null}
          {collateralToken1 ? (
            <div>
              {collateral1.amount} {collateralToken1?.symbol}
            </div>
          ) : null}
        </div>
      </td> */}
      <td className="p-4 text-center">{collateralData?.numberOfLoanDays} Days</td>
      <td className="p-4 text-center ">{Number(collateralData?.paymentCount ?? 0)}</td>
      <td className="p-4 text-center"> </td>
      <td className="p-3 text-center">{ltv(collateralData?.ltv)}</td>
      <td className="p-3 text-center">{collateralData?.numberOfLoanDays} Days</td>
      <td className="p-3 text-center">{Number(collateralData?.paymentCount ?? 0)}</td>
      <td className="p-3 text-center">
        {percent({ value: event?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
      <td className="p-3 text-center">
        {percent({ value: collateralData?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
    </tr>
  )
}
