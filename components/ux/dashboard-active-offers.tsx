import { useControlledAddress } from "@/hooks/useControlledAddress"
import { LoanStatus } from "@/hooks/useLoanValues"
import { useOfferLenderData } from "@/hooks/useOfferLenderData"
import { percent } from "@/lib/display"
import { findTokenByAddress } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { GetDataResponse } from "@/services/api"
import { Redo } from "lucide-react"
import { useMemo, useState } from "react"
import { Address } from "wagmi"
import { Button } from "../ui/button"
import DisplayToken from "./display-token"
import { useOfferCollateralData } from "@/hooks/useOfferCollateralData"
import { useRouter } from "next/navigation"

const DashboardActiveOffers = ({
  lending,
  collateral,
}: {
  lending: GetDataResponse["lend"]
  collateral: GetDataResponse["borrow"]
}) => {
  return (
    <div className="">
      <div className="flex items-center gap-2">
        <div>Active Offers</div>
        <Redo className="w-5 h-5" />
      </div>
      <DashboardActiveOffersTable lending={lending} collateral={collateral} />
    </div>
  )
}

export default DashboardActiveOffers

const DashboardActiveOffersTable = ({
  collateral,
  lending,
}: {
  collateral: GetDataResponse["borrow"]
  lending: GetDataResponse["lend"]
}) => {
  const [status, setStatus] = useState<LoanStatus>("Lent")
  const { address } = useControlledAddress()

  return (
    <div className="flex flex-col w-full gap-0 my-5">
      <div className="w-full sm:bg-[#262525] border-b border-[#4A2F35] flex flex-row gap-2 ">
        <div className={cn("min-w-[120px]", status === "Lent" ? "table-tab-active" : undefined)}>
          <Button variant="table-tab" onClick={() => setStatus("Lent")}>
            Lend
          </Button>
        </div>
        <div className={cn("min-w-[120px]", status === "Borrowed" ? "table-tab-active" : undefined)}>
          <Button variant="table-tab" onClick={() => setStatus("Borrowed")}>
            Borrow
          </Button>
        </div>
      </div>
      <div>
        <table
          className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table"
          suppressHydrationWarning
        >
          <thead className="text-white" suppressHydrationWarning>
            <tr
              className={cn(
                "flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-xs"
              )}
            >
              <th className="p-3 text-center">Collateral</th>
              <th className="p-3 text-center">Lending</th>
              <th className="p-3 text-center">Interest(%)</th>
              <th className="p-3 text-center">Pay.Am.</th>
            </tr>
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {status === "Lent"
              ? lending.map((item: any) => {
                  return (
                    <DashboardActiveOffersTableLendItem
                      key={`td_${status}_${item.id}`}
                      address={address as Address}
                      item={item}
                    />
                  )
                })
              : null}
            {status === "Borrowed"
              ? collateral.map((item: any) => {
                  return (
                    <DashboardActiveOffersTableBorrowItem
                      key={`td_${status}_${item.id}`}
                      address={address as Address}
                      item={item}
                    />
                  )
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DashboardActiveOffersTableLendItem = ({ address, item }: { address: Address; item: any }) => {
  const { data: lender } = useOfferLenderData(address, item.id)

  if (!lender) {
    return null
  }

  console.log("lender", lender)

  // @ts-ignore todo: ignored to help build, come back and check this is still true
  const lenderToken = findTokenByAddress("fantom", lender.lenderToken)

  const collateral0 = lender?.collaterals[0] ?? undefined
  const collateralToken0 = collateral0 ? findTokenByAddress("fantom", collateral0.address) : undefined
  const collateral1 = lender?.collaterals[1] ?? undefined
  const collateralToken1 = collateral1 ? findTokenByAddress("fantom", collateral1.address) : undefined

  return (
    <tr className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0" key={item.id}>
      {/* Collateral */}
      <td className="p-3 flex flex-col gap-1 items-center">
        {collateralToken0 ? <DisplayToken token={collateralToken0} size={24} /> : null}
        {collateralToken1 ? <DisplayToken token={collateralToken1} size={24} /> : null}
      </td>
      {/* Lending */}
      <td className="p-3 align-top text-center">
        {lenderToken ? <DisplayToken token={lenderToken} size={24} /> : null}
      </td>
      <td className="p-3 align-top text-center">{percent({ value: Number(lender.interest) })}</td>
      <td className="p-3 align-top text-center">{Number(lender.paymentCount)}</td>
    </tr>
  )
}

const DashboardActiveOffersTableBorrowItem = ({ address, item }: { address: Address; item: any }) => {
  const router = useRouter()
  const { data } = useOfferCollateralData(address, item.id)

  if (!data) {
    return null
  }

  const lenderToken = data?.lending?.token
  const collateralToken0 = data?.collaterals[0]?.token
  const collateralToken1 = data?.collaterals[1]?.token

  return (
    <tr
      className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0 text-xs cursor-pointer"
      key={item.id}
      onClick={() => {
        router.push(`/borrow-offer/${item.id}`)
      }}
    >
      {/* Collateral */}
      <td className="p-3 flex flex-col gap-1 items-center">
        {collateralToken0 ? <DisplayToken token={collateralToken0} size={24} /> : null}
        {collateralToken1 ? <DisplayToken token={collateralToken1} size={24} /> : null}
      </td>
      {/* Lending */}
      <td className="p-3 align-top text-center items-center">
        {lenderToken ? <DisplayToken token={lenderToken} size={24} /> : null}
      </td>
      <td className="p-3 align-top text-center">{percent({ value: Number(data.interest) })}</td>
      <td className="p-3 align-top text-center">{Number(data.paymentCount)}</td>
    </tr>
  )
}
