import { Token } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"

const DisplayToken = ({
  token,
  size,
  amount,
  className,
}: {
  token: Token
  size: number
  amount?: number
  className?: string
}) => {
  return (
    <div className={cn("flex flex-row gap-2 items-center", className)}>
      <TokenImage width={size ?? 24} height={size ?? 24} chainSlug="fantom" symbol={token.symbol} />
      {amount ? <span className="text-white">{amount}</span> : null}
      {token.symbol}
    </div>
  )
}

export default DisplayToken
