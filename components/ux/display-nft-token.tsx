import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { UserNftInfo } from "@/hooks/useNftInfo"
import useNftUnderlying from "@/hooks/useNftUnderlying"
import { dollars, formatNumber, yesNo } from "@/lib/display"
import { Token, isNft, nftUnderlyingToken } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { LucideCornerDownRight } from "lucide-react"
import { ShowWhenTrue } from "./conditionals"
import TokenImage from "./token-image"

type DisplayKeys = "Icon" | "Amount" | "Name"

const DisplayNftToken = ({
  token,
  size,
  amount,
  decimals = 2,
  className,
  displayOrder = ["Icon", "Amount", "Name"],
  chainSlug = "fantom",
  nftInfo,
  wantedLockedEqual,
  showExtendedUnderlying = false,
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
  showExtendedUnderlying?: boolean
}) => {
  const { underlying, underlyingPrice } = useNftUnderlying({ token, chainSlug })

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

  const underlyingValue = Number(nftInfo?.amount) * Number(underlyingPrice)
  console.log("underlyingValue", underlyingValue)

  return (
    <div className="flex flex-col space-y-[2px]">
      <div className={cn("flex flex-row flex-wrap gap-[6px] items-center relative group", className)}>
        {displayOrder.map((component) => components[component])}
      </div>
      <ShowWhenTrue when={isNft(token) && showExtendedUnderlying}>
        <div className="ml-12 flex flex-row items-center gap-1 text-xs text-[#8D8B8C]">
          <LucideCornerDownRight className="w-3 h-3 inline  stroke-[#8D8B8C]" /> {nftInfo?.amount} {underlying?.symbol}
        </div>
        <div className="ml-12 flex flex-row items-center gap-1 text-xs text-[#8D8B8C] italic">
          <LucideCornerDownRight className="w-3 h-3 inline stroke-[#8D8B8C]" /> {dollars({ value: underlyingValue })}{" "}
          value
        </div>
      </ShowWhenTrue>
    </div>
  )
}

export default DisplayNftToken

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
