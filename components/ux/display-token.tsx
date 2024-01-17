import { formatNumber, yesNo } from "@/lib/display"
import { Token, isNft, nftUnderlyingToken } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"
import { UserNftInfo } from "@/hooks/useNftInfo"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

type DisplayKeys = "Icon" | "Amount" | "Name"

const DisplayToken = ({
  token,
  size,
  amount,
  decimals = 2,
  className,
  displayOrder = ["Icon", "Amount", "Name"],
  chainSlug = "fantom",
  nftInfo,
}: {
  token: Token
  size: number
  amount?: number
  decimals?: number
  className?: string
  displayOrder?: DisplayKeys[]
  chainSlug?: string
  nftInfo?: UserNftInfo
}) => {
  const components: Record<DisplayKeys, JSX.Element | false | undefined | null> = {
    Icon: displayOrder.includes("Icon") && (
      <TokenImage
        key="Icon"
        width={size ?? 24}
        height={size ?? 24}
        chainSlug={chainSlug}
        symbol={token?.symbol}
        className="mr-[2px]"
      />
    ),
    Amount: displayOrder.includes("Amount") ? (
      <DisplayAmount amount={amount} decimals={decimals} nftInfo={nftInfo} token={token} chainSlug={chainSlug} />
    ) : null,
    Name: displayOrder.includes("Name") ? <span key="Name">{token?.symbol}</span> : null,
  }

  return (
    <div className={cn("flex flex-row flex-wrap gap-[6px] items-center relative group", className)}>
      {displayOrder.map((component) => components[component])}
    </div>
  )
}

export default DisplayToken

const DisplayAmount = ({
  amount,
  decimals,
  nftInfo,
  token,
  chainSlug,
}: {
  amount?: number
  decimals?: number
  nftInfo?: UserNftInfo
  token: Token
  chainSlug?: string
}) => {
  // handle if token is an NFT
  if (isNft(token)) {
    const underlyingToken = nftUnderlyingToken(token, chainSlug)

    return (
      <span key="Amount" className="text-white">
        <HoverCard>
          <HoverCardTrigger>#{nftInfo?.id}</HoverCardTrigger>
          <HoverCardContent className="bg-[#212121] border-[1px]  border-[#743A49] text-sm grid grid-cols-[80px_minmax(120px,_1fr)]">
            <div>Locked:</div>
            <div>
              {nftInfo?.amount} {underlyingToken?.symbol}
            </div>
            {/* <div>NFT:</div>
            <div>
              {nftInfo?.id} {token?.symbol}
            </div> */}
            <div>Voted:</div>
            <div>{yesNo(nftInfo?.voted)}</div>
          </HoverCardContent>
        </HoverCard>
      </span>
    )
  }

  if (amount !== undefined) {
    return (
      <span key="Amount" className="text-white">
        {formatNumber({ value: amount, decimals })}
      </span>
    )
  }
}

{
  /*
  Idea to show more data of the NFT
  isNFT ? (
        <div className="absolute group-hover:flex hidden group-hover:animate-enter-div bg-[#1c1e26]/100 border-2 z-10 border-white/10 h-44 w-80 top-0 left-5 rounded-xl items-center justify-center">
          {tokenId == 0 ? (
            <>
              <TokenImage
                key="Icon"
                width={96}
                height={96}
                chainSlug="fantom"
                symbol={token?.symbol}
                className="mr-[2px] rounded-full px-5"
              />

              <div className=" flex flex-col  gap-3">
                <div className="text-white font-semibold text-sm">{token.name} </div>
                <div className="text-gray-400 text-sm w-11/12 ">
                  All Cats are Bastards - 1312 Collectibles 2022 straight from the bassment. Artwork will be revealed
                  when minting goes live.
                </div>
              </div>
            </>
          ) : (
            "Load token id data"
          )}
        </div>
      ) : (
        ""
      ) */
}
