import { formatNumber } from "@/lib/display"
import { Token } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"

const DisplayToken = ({
  token,
  size,
  amount,
  decimals = 2,
  className,
}: {
  token: Token
  size: number
  amount?: number
  decimals?: number
  className?: string
}) => {
  return (
    <div className={cn("flex flex-row flex-wrap gap-[6px] items-center", className)}>
      <TokenImage
        width={size ?? 24}
        height={size ?? 24}
        chainSlug="fantom"
        symbol={token.symbol}
        className="mr-[2px]"
      />
      {amount ? <span className="text-white">{formatNumber({ value: amount, decimals })}</span> : null}
      {token.symbol}
    </div>
  )
}

export default DisplayToken
