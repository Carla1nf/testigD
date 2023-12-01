import { Token } from "@/lib/tokens"
import TokenImage from "./token-image"

const DisplayToken = ({ token, size }: { token: Token; size: number }) => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <TokenImage width={size ?? 24} height={size ?? 24} chainSlug="fantom" symbol={token.symbol} />
      {token.symbol}
    </div>
  )
}

export default DisplayToken
