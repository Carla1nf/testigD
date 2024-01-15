import { PersonIcon } from "@/components/icons"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import { shortAddress } from "@/lib/display"
import { Token } from "@/lib/tokens"
import { Address } from "viem"

const NotOwnerInfo = ({
  state,
  borrowingToken,
  ownerAddress,
}: {
  state: any
  borrowingToken?: Token
  ownerAddress: Address
}) => {
  return (
    <ShowWhenTrue when={state.matches("isNotOwner")}>
      <div className="flex justify-between gap-8">
        <div className="bg-[#21232B]/40 border-2 border-white/10 p-4 w-full rounded-xl flex gap-2 items-center justify-center  ">
          You could borrow {borrowingToken?.symbol} from
          <PersonIcon className="w-6 h-6" />
          {shortAddress(ownerAddress)}
        </div>
      </div>
    </ShowWhenTrue>
  )
}

export default NotOwnerInfo
