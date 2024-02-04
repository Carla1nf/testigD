import DisplayToken from "@/components/ux/display-token"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useOffer } from "@/hooks/useOffer"
import { ltv, percent } from "@/lib/display"
import { Token } from "@/lib/tokens"
import { useRouter } from "next/navigation"

const TableRow = ({ event, token, index }: { event: any; token?: Token; index: number }) => {
  const router = useRouter()
  const { address } = useControlledAddress()
  const { data: offer } = useOffer(address, event.address)
  const currentChain = useCurrentChain()

  return (
    <tr
      onClick={() => {
        router.push(`/lend-offer/${event.address}`)
      }}
      key={`${offer?.principle?.token?.symbol}_${event.address}`}
      className={` ${
        index % 2 == 1 ? "" : "bg-stone-500/5"
      } hover:bg-slate-500/10 hover:bg-[#383838] cursor-pointer animate-enter-token border-b-2 border-gray-500/5`}
    >
      <td className="p-4 text-left">
        {token ? (
          <DisplayToken size={28} token={token} amount={offer?.principle.amount} chainSlug={currentChain.slug} />
        ) : null}
      </td>
      <td className="p-3 text-left">
        <div className="flex flex-col gap-2">
          {offer?.collateral.token ? (
            <DisplayToken
              size={28}
              token={offer?.collateral.token}
              chainSlug={currentChain.slug}
              amount={offer?.collateral.amount}
            />
          ) : null}
        </div>
      </td>
      <td className="p-3 text-center">{ltv(Number(offer?.ltv))}</td>
      <td className="p-3 text-center">{offer?.numberOfLoanDays} Days</td>
      <td className="p-3 text-center">{Number(offer?.paymentCount ?? 0)}</td>
      <td className="p-3 text-center">
        {percent({ value: offer?.interest ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
      <td className="p-3 text-center">
        {percent({ value: offer?.apr ?? 0, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
      </td>
    </tr>
  )
}

export default TableRow
