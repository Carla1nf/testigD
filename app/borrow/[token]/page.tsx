"use client"

import { HourGlassIcon, PriceIcon } from "@/components/icons"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import Stat from "@/components/ux/stat"
import { useBorrowMarket } from "@/hooks/useBorrowMarket"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useOfferLenderData } from "@/hooks/useOfferLenderData"
import { useSpecificBorrowMarketStats } from "@/hooks/useSpecificBorrowMarketStats"
import { dollars, ltv, percent } from "@/lib/display"
import { filterOffersByToken } from "@/lib/filters"
import { Token, findInternalTokenByAddress } from "@/lib/tokens"
import { PercentIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

export default function SpecificLend({ params }: { params: { token: string } }) {
  const currentChain = useCurrentChain()
  const stats = useSpecificBorrowMarketStats(params.token)
  const token = findInternalTokenByAddress(currentChain.slug, params.token)
  const { offers } = useBorrowMarket()
  const marketOffers = token ? filterOffersByToken(offers, token) : []
  const events = Array.isArray(marketOffers) && marketOffers.length > 0 ? marketOffers[0].events : []

  const breadcrumbs = useMemo(
    () => [
      <DisplayNetwork currentChain={currentChain} size={18} key="network" />,
      <Link href={`/borrow/`} className="hover:text-white/75" key="lending-market">
        Borrowing Market
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
              Borrowing {token ? <DisplayToken size={28} token={token} className="flex-row-reverse gap-1" /> : null}
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
              title={"Waiting to be borrowed"}
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
          <thead className="text-white" suppressHydrationWarning>
            <tr
              className="flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left"
              suppressHydrationWarning
            >
              <th className="p-3 text-left">Borrow</th>
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
              return <TableRow event={event} token={token} key={event.id} />
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
  const { data: data } = useOfferLenderData(address, event.id)

  const collateral0 = data?.collaterals[0]
  const collateral1 = data?.collaterals[1]
  const collateralToken0 = collateral0?.token
  const collateralToken1 = collateral1?.token
  // const lenderToken = collateralData?.lender?.token

  // console.log("data", data)

  return (
    <tr
      onClick={() => {
        router.push(`/lend-offer/${event.id}`)
      }}
      key={`${data?.borrowing?.token?.symbol}_${event.id}`}
      className="hover:bg-[#383838] cursor-pointer"
    >
      <td className="p-3 text-left">
        {token ? <DisplayToken size={28} token={token} amount={event.lendingAmount} /> : null}
      </td>
      <td className="p-3 text-left">
        <div className="flex flex-col gap-2">
          {collateralToken0 ? <DisplayToken size={28} token={collateralToken0} amount={collateral0.amount} /> : null}
          {collateralToken1 ? <DisplayToken size={28} token={collateralToken1} amount={collateral1.amount} /> : null}
        </div>
      </td>
      <td className="p-3 text-center">{ltv(Number(data?.ltv))}</td>
      <td className="p-3 text-center">{data?.numberOfLoanDays} Days</td>
      <td className="p-3 text-center">{Number(data?.paymentCount ?? 0)}</td>
      <td className="p-3 text-center">
        {percent({ value: event?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
      <td className="p-3 text-center">
        {percent({ value: data?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
    </tr>
  )
}
