import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { LoanStatus } from "@/hooks/useLoanValues"
import { useOffer } from "@/hooks/useOffer"
import { percent } from "@/lib/display"
import { findTokenByAddress } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { GetDataResponse } from "@/services/api"
import { Redo } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Address } from "wagmi"
import { Button } from "../ui/button"
import DisplayToken from "./display-token"
import { NoOffers } from "./noOffers"

const DashboardActiveOffers = ({
  lending,
  collateral,
  status,
}: {
  lending: GetDataResponse["lend"]
  collateral: GetDataResponse["borrow"]
  status: string
}) => {
  return (
    <div className="">{<DashboardActiveOffersTable lending={lending} collateral={collateral} status={status} />}</div>
  )
}

export default DashboardActiveOffers

const DashboardActiveOffersTable = ({
  collateral,
  lending,
  status,
}: {
  collateral: GetDataResponse["borrow"]
  lending: GetDataResponse["lend"]
  status: string
}) => {
  const { address } = useControlledAddress()

  return (
    <div className="flex flex-col w-full gap-0 my-5">
      <div className="w-full sm:bg-[#262525] flex flex-row gap-2 "></div>
      <div>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white opacity-60 font-medium text-sm" suppressHydrationWarning>
            <tr
              className={cn(
                "flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left text-white  font-medium text-sm bg-black"
              )}
            >
              <th className="p-3 px-5">Collateral</th>
              <th className="p-3 ">Lending</th>
              <th className="p-3">Interest(%)</th>
              <th className="p-3">Pay.Am.</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none ">
            {status === "Lent" ? (
              <>
                {lending.map((item: any) => {
                  return (
                    <DashboardActiveOffersTableLendItem
                      key={`td_${status}_${item.address}`}
                      address={address as Address}
                      item={item}
                    />
                  )
                })}
              </>
            ) : null}
            {status === "Borrowed" ? (
              <>
                {collateral.map((item: any) => {
                  return (
                    <DashboardActiveOffersTableBorrowItem
                      key={`td_${status}_${item.address}`}
                      address={address as Address}
                      item={item}
                    />
                  )
                })}
              </>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DashboardActiveOffersTableLendItem = ({ address, item }: { address: Address; item: any }) => {
  const router = useRouter()
  const currentChain = useCurrentChain()
  const { data: offer } = useOffer(address, item.address)

  if (!offer) {
    return null
  }

  // @ts-ignore todo: ignored to help build, come back and check this is still true
  const lenderToken = offer?.principle?.token

  const collateral = offer?.collateral
  const collateralToken = collateral ? findTokenByAddress(currentChain.slug, collateral.address) : undefined

  return (
    <tr
      className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0  cursor-pointer hover:bg-neutral-800/60 bg-neutral-900/70 shadow animate-enter-token"
      key={item.address}
      onClick={() => {
        router.push(`/lend-offer/${item.address}`)
      }}
    >
      {/* Collateral */}
      <td className="p-2 flex flex-col gap-1 px-5">
        {collateralToken ? <DisplayToken token={collateralToken} size={20} chainSlug={currentChain.slug} /> : null}
      </td>
      {/* Lending */}
      <td className="p-2 align-top text-center items-center">
        {lenderToken ? <DisplayToken token={lenderToken} size={20} chainSlug={currentChain.slug} /> : null}
      </td>
      <td className="p-2 align-top">{percent({ value: Number(offer.interest) })}</td>
      <td className="p-2 align-top">{Number(offer.paymentCount)}</td>
    </tr>
  )
}

const DashboardActiveOffersTableBorrowItem = ({ address, item }: { address: Address; item: any }) => {
  const router = useRouter()
  const currentChain = useCurrentChain()
  const { data } = useOffer(address, item.address)

  if (!data) {
    return null
  }

  const principleToken = data?.principle?.token
  const collateralToken = data?.collateral?.token

  return (
    <tr
      className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0  cursor-pointer hover:bg-neutral-800/60 bg-neutral-900/70 shadow animate-enter-token"
      key={item.id}
      onClick={() => {
        router.push(`/borrow-offer/${item.address}`)
      }}
    >
      {/* Collateral */}
      <td className="p-2 flex flex-col gap-1 px-5">
        {collateralToken ? <DisplayToken token={collateralToken} size={20} chainSlug={currentChain.slug} /> : null}
      </td>
      {/* Lending */}
      <td className="p-2 align-top text-center items-center">
        {principleToken ? <DisplayToken token={principleToken} size={20} chainSlug={currentChain.slug} /> : null}
      </td>
      <td className="p-2 align-top">{percent({ value: Number(data.interest) })}</td>
      <td className="p-2 align-top">{Number(data.paymentCount)}</td>
    </tr>
  )
}
