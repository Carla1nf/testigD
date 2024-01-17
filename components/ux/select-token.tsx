"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useRef, useState } from "react"
import { getAddress } from "viem"
import { Input } from "../ui/input"
import { ShowWhenFalse, ShowWhenTrue } from "./conditionals"
import DisplayToken from "./display-token"
import { UserNftInfo } from "@/hooks/useNftInfo"
import { yesNo } from "@/lib/display"
import { useInternalToken } from "@/hooks/useInternalToken"
import { Badge } from "../ui/badge"

const SelectToken = ({
  amount,
  selectedToken,
  selectedUserNft,
  tokens,
  defaultToken,
  onSelectToken,
  onSelectUserNft,
  onAmountChange,
  userNftInfo,
}: {
  amount: number | undefined
  selectedToken: Token | undefined
  selectedUserNft: UserNftInfo | undefined
  tokens?: Token[]
  defaultToken: Token
  onSelectToken: (token: Token | null) => void
  onSelectUserNft: (nftInfo: UserNftInfo | null) => void
  onAmountChange: (value: number | undefined) => void
  userNftInfo?: any
}) => {
  const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false)
  const [isNftPopupOpen, setIsNftPopupOpen] = useState(false)
  const currentChain = useCurrentChain()
  const underlying = useInternalToken(currentChain.slug, selectedToken?.nft?.underlying ?? "")

  const ref = useRef(null)

  return (
    <div className="flex flex-row items-center bg-[#2F2F2F] px-4 py-1 gap-2 rounded-lg w-full">
      <Popover open={isTokenPopupOpen} onOpenChange={setIsTokenPopupOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="create"
            role="combobox"
            aria-expanded={isTokenPopupOpen}
            className="basis-2/3 justify-start pl-1"
          >
            {selectedToken ? (
              <DisplayToken
                token={selectedToken}
                size={24}
                className="text-base font-bold"
                chainSlug={currentChain.slug}
              />
            ) : (
              <span className="text-sm font-normal text-[#757575]">Select token...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[320px] p-0">
          <Command
            filter={(itemAddress, search) => {
              const token = tokens?.find((token) => getAddress(token.address) === getAddress(itemAddress))
              if (token) {
                const searchLower = search.toLowerCase()
                if (
                  token.symbol.toLowerCase().includes(searchLower) ||
                  token.name.toLowerCase().includes(searchLower) ||
                  token.address.toLowerCase().includes(searchLower)
                ) {
                  return 1
                }
              }
              return 0
            }}
          >
            <CommandInput placeholder="Select Token / Paste an address" />
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens?.map((token) => (
                <CommandItem
                  key={token.address}
                  value={token.address}
                  onSelect={(selected) => {
                    // if we have a new token selected
                    if (selected !== selectedToken?.address) {
                      if (onSelectToken) {
                        onSelectToken(token)
                      }
                    } else {
                      // we have the same token selected, so, act like a toggle and use the default token instead
                      if (onSelectToken) {
                        onSelectToken(defaultToken)
                      }
                    }
                    setIsTokenPopupOpen(false)
                  }}
                >
                  <ShowWhenTrue
                    when={selectedToken?.address ? getAddress(selectedToken?.address) === token.address : false}
                  >
                    <Check className={cn("mr-2 h-4 w-4", "opacity-100")} />
                  </ShowWhenTrue>
                  <ShowWhenFalse
                    when={selectedToken?.address ? getAddress(selectedToken?.address) === token.address : false}
                  >
                    <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                  </ShowWhenFalse>

                  <DisplayToken token={token} size={24} className="text-base font-bold" chainSlug={currentChain.slug} />

                  <ShowWhenTrue when={Boolean(token?.nft)}>
                    <div className="ml-auto flex-inline flex-row items-center">
                      <Badge padding="tight" text="tiny" className="max-h-[18px]">
                        NFT
                      </Badge>
                    </div>
                  </ShowWhenTrue>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <ShowWhenTrue when={Boolean(selectedToken?.nft)}>
        <Popover open={isNftPopupOpen} onOpenChange={setIsNftPopupOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="create"
              role="combobox"
              aria-expanded={isNftPopupOpen}
              className="basis-2/3 justify-start pl-1"
            >
              NFT #{selectedUserNft?.id ?? ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="min-w-[480px] p-0">
            <Command>
              <CommandEmpty>No token found.</CommandEmpty>
              <CommandGroup>
                {userNftInfo?.map((nftInfo: UserNftInfo) => (
                  <CommandItem
                    key={nftInfo?.id}
                    value={nftInfo?.id?.toString()}
                    onSelect={(selected) => {
                      console.log("userNftInfo->selected", selected)

                      // if we have a new nftInfo selected
                      const found = userNftInfo?.find((nftInfo: UserNftInfo) => nftInfo?.id?.toString() === selected)

                      // we have the same token selected, so, act like a toggle and use the default token instead
                      if (found && onSelectUserNft) {
                        onSelectUserNft(found)
                      }

                      setIsNftPopupOpen(false)
                    }}
                  >
                    <div className="flex flex-row justify-between w-full items-center px-1 py-2">
                      {selectedToken ? (
                        <DisplayToken
                          token={selectedToken}
                          size={20}
                          className="text-base"
                          chainSlug={currentChain.slug}
                        />
                      ) : null}

                      <div>#{Number(nftInfo?.id)}</div>
                      <div>
                        {Number(nftInfo?.amount).toFixed(4)} {underlying?.symbol ?? ""}
                      </div>
                      <div>Voted? {yesNo(nftInfo?.voted)}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </ShowWhenTrue>
      <div className="grow">
        <Input
          ref={ref}
          pattern="[0-9]*"
          variant="create"
          type="number"
          value={amount}
          min={0}
          onChange={(e) => {
            const value = parseFloat(e.target.value || "0")

            // fix the leading 0 issue on number inputs
            if (ref.current) {
              // @ts-ignore
              ref.current.value = value.toString()
            }

            if (!Number.isNaN(value) && value >= 0) {
              if (onAmountChange) {
                onAmountChange(value)
              }
            } else {
              if (onAmountChange) {
                onAmountChange(undefined)
              }
            }
          }}
          className="px-2 py-1 bg-[#2F2F2F] text-base font-bold tracking-wide text-[#9F9F9F] leading-6"
          placeholder="0"
        />
      </div>
      <ShowWhenTrue when={isTokenPopupOpen}>
        <ChevronUp
          className="h-6 w-6 shrink-0 opacity-50 text-[#D75071] cursor-pointer"
          onClick={() => setIsTokenPopupOpen(false)}
        />
      </ShowWhenTrue>
      <ShowWhenFalse when={isTokenPopupOpen}>
        <ChevronDown
          className="h-6 w-6 shrink-0 opacity-50 stroke-[#D75071] cursor-pointer"
          onClick={() => setIsTokenPopupOpen(true)}
        />
      </ShowWhenFalse>
    </div>
  )
}

export default SelectToken
