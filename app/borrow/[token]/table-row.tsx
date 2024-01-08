import DisplayToken from "@/components/ux/display-token"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import { useOfferLenderData } from "@/hooks/useOfferLenderData"
import { ltv, percent } from "@/lib/display"
import { Token } from "@/lib/tokens"
import { useRouter } from "next/navigation"

const TableRow = ({ event, token }: { event: any; token?: Token }) => {
  const router = useRouter()
  const { address } = useControlledAddress()
  const { data: data } = useOfferLenderData(address, event.address)

  const collateral0 = data?.collaterals
  const collateralToken0 = collateral0?.token
  // const lenderToken = collateralData?.lender?.token

  // console.log("data", data)

  return (
    <tr
      onClick={() => {
        router.push(`/lend-offer/${event.address}`)
      }}
      key={`${data?.borrowing?.token?.symbol}_${event.address}`}
      className="hover:bg-[#383838] cursor-pointer animate-enter-token border-b-2 border-gray-500/5"
    >
      <td className="p-4 text-left">
        {token ? <DisplayToken size={28} token={token} amount={event.lendingAmount} /> : null}
      </td>
      <td className="p-3 text-left">
        <div className="flex flex-col gap-2">
          {collateralToken0 ? <DisplayToken size={28} token={collateralToken0} amount={collateral0.amount} /> : null}
        </div>
      </td>
      <td className="p-3 text-center">{ltv(Number(data?.ltv))}</td>
      <td className="p-3 text-center">{data?.numberOfLoanDays} Days</td>
      <td className="p-3 text-center">{Number(data?.paymentCount ?? 0)}</td>
      <td className="p-3 text-center">
        {percent({ value: data?.interest ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
      <td className="p-3 text-center">
        {percent({ value: data?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
    </tr>
  )
}

export default TableRow
