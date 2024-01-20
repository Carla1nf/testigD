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
  wantedLockedEqual,
}: {
  token: Token
  size: number
  amount?: number
  decimals?: number
  className?: string
  displayOrder?: DisplayKeys[]
  chainSlug?: string
  nftInfo?: UserNftInfo
  wantedLockedEqual?: number
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
      <DisplayAmount
        amount={amount}
        decimals={decimals}
        nftInfo={nftInfo}
        token={token}
        chainSlug={chainSlug}
        wantedLockedEqual={wantedLockedEqual}
      />
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
  wantedLockedEqual,
}: {
  amount?: number
  decimals?: number
  nftInfo?: UserNftInfo
  token: Token
  chainSlug?: string
  wantedLockedEqual?: number
}) => {
  // handle if token is an NFT
  if (isNft(token)) {
    const underlyingToken = nftUnderlyingToken(token, chainSlug)

    if (nftInfo) {
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
    } else if (wantedLockedEqual) {
      return (
        <span key="Amount" className="text-white">
          <HoverCard>
            <HoverCardTrigger>Wanted</HoverCardTrigger>
            <HoverCardContent className="bg-[#212121] border-[1px]  border-[#743A49] text-sm grid grid-cols-[80px_minmax(120px,_1fr)]">
              <div>Minimum Locked:</div>
              <div>
                {" "}
                {wantedLockedEqual} {underlyingToken?.symbol}
              </div>
            </HoverCardContent>
          </HoverCard>
        </span>
      )
    }
  }

  if (amount) {
    return (
      <span key="Amount" className="text-white">
        {formatNumber({ value: amount, decimals })}
      </span>
    )
  }

  return null
}
