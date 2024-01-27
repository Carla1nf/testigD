import { formatNumber } from "@/lib/display"
import { Token, findInternalTokenByAddress, isNft } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import TokenImage from "./token-image"
import { Address } from "viem"

type DisplayKeys = "Icon" | "Amount" | "Name"

const DisplayPair = ({
  token0,
  token1,
  size,
  amount,
  decimals = 2,
  className,
  displayOrder = ["Icon", "Amount", "Name"],
  chainSlug = "fantom",
}: {
  token0: Address
  token1: Address
  size: number
  amount?: number
  decimals?: number
  className?: string
  displayOrder?: DisplayKeys[]
  chainSlug?: string
}) => {
  const firstToken = findInternalTokenByAddress(chainSlug, token0)
  const secondToken = findInternalTokenByAddress(chainSlug, token1)

  const components: Record<DisplayKeys, JSX.Element | false | undefined | null> = {
    Icon: displayOrder.includes("Icon") && (
      <>
        <TokenImage
          key="Icon"
          width={size ?? 24}
          height={size ?? 24}
          chainSlug={chainSlug}
          symbol={firstToken?.symbol}
          className="mr-[2px]"
        />

        <TokenImage
          key="Icon"
          width={size ?? 24}
          height={size ?? 24}
          chainSlug={chainSlug}
          symbol={secondToken?.symbol}
          className="mr-[2px] absolute ml-5"
        />
      </>
    ),
    Amount: null,
    Name: null,
  }

  return (
    <div className={cn("flex flex-row flex-wrap gap-[6px] items-center relative group", className)}>
      {displayOrder.map((component) => components[component])}
    </div>
  )
}

export default DisplayPair
