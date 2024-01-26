import { formatNumber } from "@/lib/display"
import { Token, isNft } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"

type DisplayKeys = "Icon" | "Amount" | "Name"

const DisplayToken = ({
  token,
  size,
  amount,
  decimals = 2,
  className,
  displayOrder = ["Icon", "Amount", "Name"],
  chainSlug = "fantom",
}: {
  token: Token
  size: number
  amount?: number
  decimals?: number
  className?: string
  displayOrder?: DisplayKeys[]
  chainSlug?: string
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
      isNft(token) ? null : (
        <DisplayAmount amount={amount} decimals={decimals} />
      )
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

const DisplayAmount = ({ amount, decimals }: { amount?: number; decimals?: number }) => {
  if (amount) {
    return (
      <span key="Amount" className="text-white">
        {formatNumber({ value: amount, decimals })}
      </span>
    )
  }

  return null
}
