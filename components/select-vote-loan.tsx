import { useLoanValues } from "@/hooks/useLoanValues"
import { Token, isNft, nftInfoLens, nftInfoLensType } from "@/lib/tokens"
import { Address } from "viem"
import DisplayNftToken from "./ux/display-nft-token"
import useNftInfo from "@/hooks/useNftInfo"
import { ShowWhenFalse, ShowWhenTrue } from "./ux/conditionals"
import { useLastVoted } from "@/hooks/useLastVoted"

const SelectVoteLoan = ({ address, index, selected }: { address: Address; index: number; selected: number | null }) => {
  // Select Vote Loan
  const { isSuccess, isLoading, isError, data } = useLoanValues(address, index, "Borrowed")
  const nftInfo = useNftInfo({ address: data?.loan.address, token: data?.loan.collaterals })
  const now = Math.floor(new Date().getTime() / 1000)
  const Duration = 604800
  const { lastVoted } = useLastVoted({
    veNFTID: nftInfo[0]?.id,
    voterAddress: data?.loan.collaterals.nft?.voter as Address,
  })
  const shouldVote = Math.floor(now / Duration) * Duration > Number(lastVoted)

  if (data?.loan.executed) {
    return null
  }

  if (Number(data?.ownerNftTokenId) % 2 == 1) {
    return null
  }
  console.log(data?.loan.collaterals)
  if (nftInfoLensType(data?.loan.collaterals) != "VeToken") {
    return null
  }

  return (
    <>
      <div
        className={`flex flex-col flex-no cursor-pointer animate-enter-token hover:bg-neutral-800/60 shadow w-full py-3 px-3 rounded-b-xl bg-stone-500/5`}
      >
        <ShowWhenTrue when={isNft(data?.loan.collaterals)}>
          <div className="flex items-center">
            <div className="w-full py-1">
              <DisplayNftToken token={data?.loan.collaterals as Token} size={20} nftInfo={nftInfo[0]} />
            </div>
            <ShowWhenTrue when={selected == index && shouldVote}>
              <div className="w-full flex justify-end px-3 ">
                <div className="text-green-400 font-medium bg-green-800/40 px-2 py-1 rounded">Selected</div>{" "}
              </div>
            </ShowWhenTrue>

            <ShowWhenFalse when={shouldVote}>
              <div className="w-full flex justify-end px-3 ">
                <div className="text-yellow-400 font-medium bg-yellow-800/40 px-2 py-1 rounded">Voted this epoch</div>{" "}
              </div>
            </ShowWhenFalse>
          </div>
        </ShowWhenTrue>
      </div>
    </>
  )
}

export default SelectVoteLoan
