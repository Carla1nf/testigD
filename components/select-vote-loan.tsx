import { useLoanValues } from "@/hooks/useLoanValues"
import { isNft, nftInfoLens, nftInfoLensType } from "@/lib/tokens"
import { Address } from "viem"
import DisplayNftToken from "./ux/display-nft-token"
import useNftInfo from "@/hooks/useNftInfo"
import { ShowWhenTrue } from "./ux/conditionals"

const SelectVoteLoan = ({ address, index }: { address: Address; index: number }) => {
  const { isSuccess, isLoading, isError, data } = useLoanValues(address, index, "Borrowed")
  const nftInfo = useNftInfo({ address: address, token: data?.loan.collaterals })

  if (Number(data?.ownerNftTokenId) % 2 == 1) {
    return null
  }
  console.log(data?.loan.collaterals)
  if (nftInfoLensType(data?.loan.collaterals) != "VeToken") {
    return null
  }

  return (
    <>
      <div className="flex flex-col flex-no cursor-pointer animate-enter-token hover:bg-neutral-800/60 bg-neutral-900/70 shadow w-full py-3 px-3 rounded-b-xl">
        <ShowWhenTrue when={isNft(data?.loan.collaterals)}>
          <DisplayNftToken token={data?.loan.collaterals} size={20} nftInfo={nftInfo[0]} />
        </ShowWhenTrue>
      </div>
    </>
  )
}

export default SelectVoteLoan
