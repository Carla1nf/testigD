import { formatNumber } from "@/lib/display"
import { Token } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"

export type DisplayOrder = "IconAmountName" | "AmountNameIcon" | "AmountIconName" | "AmountName"

type ComponentKeys = "Icon" | "Amount" | "Name"

const DisplayToken = ({
  token,
  size,
  amount,
  decimals = 2,
  className,
  displayOrder = "IconAmountName",
  chainSlug = "fantom",
}: {
  token: Token
  size: number
  amount?: number
  decimals?: number
  className?: string
  displayOrder?: DisplayOrder
  chainSlug?: string
}) => {
  const components: Record<ComponentKeys, JSX.Element | false | undefined> = {
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
    Amount: displayOrder.includes("Amount") && amount !== undefined && (
      <span key="Amount" className="text-white">
        {formatNumber({ value: amount, decimals })}
      </span>
    ),
    Name: displayOrder.includes("Name") && <span key="Name">{token?.symbol}</span>,
  }

  const orderedComponents: ComponentKeys[] = displayOrder.split(/(?=[A-Z])/) as ComponentKeys[]

  return (
    <div className={cn("flex flex-row flex-wrap gap-[6px] items-center", className)}>
      {orderedComponents.map((component) => components[component])}
    </div>
  )
}

export default DisplayToken
