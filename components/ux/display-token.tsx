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
  tokenId,
  isNFT,
  displayOrder = "IconAmountName",
}: {
  token: Token
  size: number
  amount?: number
  decimals?: number
  className?: string
  tokenId?: number
  isNFT?: boolean
  displayOrder?: DisplayOrder
}) => {
  const components: Record<ComponentKeys, JSX.Element | false | undefined> = {
    Icon: displayOrder.includes("Icon") && (
      <TokenImage
        key="Icon"
        width={size ?? 24}
        height={size ?? 24}
        chainSlug="fantom"
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
    <div className={cn("flex flex-row flex-wrap gap-[6px] items-center relative group", className)}>
      {orderedComponents.map((component) => components[component])}
    </div>
  )
}

export default DisplayToken

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
            "Mandar a otro tsx"
          )}
        </div>
      ) : (
        ""
      ) */
}
