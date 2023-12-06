import { CurrentChain } from "@/hooks/useCurrentChain"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"

const DisplayNetwork = ({
  currentChain,
  className,
  size,
}: {
  currentChain: CurrentChain
  className?: string
  size?: number
}) => {
  return (
    <div className={cn("flex items-center text-sm font-bold gap-1", className)}>
      <TokenImage width={size ?? 20} height={size ?? 20} symbol={currentChain.symbol} chainSlug={currentChain.slug} />
      {currentChain.name}
    </div>
  )
}

export default DisplayNetwork
