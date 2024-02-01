"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import useCurrentChain from "@/hooks/useCurrentChain"
import { UserNftInfo } from "@/hooks/useNftInfo"
import { yesNo } from "@/lib/display"
import { Token, isNft, nftUnderlyingToken } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useRef, useState } from "react"
import { getAddress } from "viem"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { ShowWhenFalse, ShowWhenTrue } from "./conditionals"
import DisplayToken from "./display-token"

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
  isSelectableNft,
  hideNFT,
}: {
  amount: number | undefined
  selectedToken: Token | undefined
  selectedUserNft: UserNftInfo | undefined
  tokens?: Token[]
  defaultToken: Token
  onSelectToken?: (token: Token | null) => void
  onSelectUserNft: (nftInfo: UserNftInfo | null) => void
  onAmountChange: (value: number | undefined) => void
  userNftInfo?: any
  isSelectableNft: boolean
  hideNFT?: boolean
}) => {
  const currentChain = useCurrentChain()
  const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false)
  const [isNftPopupOpen, setIsNftPopupOpen] = useState(false)
  const [wantedType, setWantedType] = useState("ERC-20")
  const selectedTokenIsNft = isNft(selectedToken)
  const underlying = selectedTokenIsNft ? nftUnderlyingToken(selectedToken, currentChain.slug) : undefined

  return (
    <div className="grid grid-cols-[152px_1fr_24px] items-center justify-between bg-[#2F2F2F] px-4 py-1 gap-2 rounded-lg w-full">
      {/* Token details column */}
      <Popover open={isTokenPopupOpen} onOpenChange={setIsTokenPopupOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="create"
            role="combobox"
            aria-expanded={isTokenPopupOpen}
            className={cn("basis-2/3 justify-start pl-1", !isSelectableNft ? "" : null)}
          >
            {selectedToken ? (
              <DisplayToken token={selectedToken} size={20} className="text-sm" chainSlug={currentChain.slug} />
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
              <div className="flex px-6 gap-5 py-3 font-bold text-gray-500">
                <div
                  className={`cursor-pointer ${wantedType == "ERC-20" ? "text-white" : ""}`}
                  onClick={() => setWantedType("ERC-20")}
                >
                  ERC-20
                </div>
                <ShowWhenFalse when={hideNFT ?? false}>
                  <div
                    className={`cursor-pointer ${wantedType == "ERC-721" ? "text-white" : ""} transition-all`}
                    onClick={() => setWantedType("ERC-721")}
                  >
                    NFT
                  </div>
                </ShowWhenFalse>
              </div>
              {tokens?.map((token) => (
                <ShowWhenFalse
                  when={
                    (Boolean(token?.nft) && Boolean(hideNFT)) ||
                    (Boolean(token?.nft) && wantedType != "ERC-721") ||
                    (!Boolean(token?.nft) && wantedType != "ERC-20")
                  }
                  key={token.address}
                >
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

                    <DisplayToken
                      token={token}
                      size={24}
                      className="text-base font-bold"
                      chainSlug={currentChain.slug}
                    />

                    <ShowWhenTrue when={Boolean(token?.nft)}>
                      <div className="ml-auto flex-inline flex-row items-center">
                        <Badge padding="tight" text="tiny" className="max-h-[18px]">
                          NFTs
                        </Badge>
                      </div>
                    </ShowWhenTrue>
                  </CommandItem>
                </ShowWhenFalse>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Amount / NFT selection column */}
      <div className="flex flex-row justify-between items-center">
        <ShowWhenTrue when={isSelectableNft}>
          <ShowWhenTrue when={selectedTokenIsNft}>
            <Popover open={isNftPopupOpen} onOpenChange={setIsNftPopupOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="create"
                  role="combobox"
                  aria-expanded={isNftPopupOpen}
                  className="pl-1 text-sm space-x-2"
                >
                  <div className="text-gray-300 font-bold">
                    {selectedUserNft?.id ? `NFT #${selectedUserNft?.id}` : "Click to select NFT"}{" "}
                  </div>
                  <ShowWhenTrue when={Boolean(selectedUserNft)}>
                    <div>-</div>
                    <div className="text-sm whitespace-nowrap">
                      {selectedUserNft?.amount.toFixed(2)} Locked {underlying?.symbol ?? ""}
                    </div>
                  </ShowWhenTrue>
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
                          const found = userNftInfo?.find(
                            (nftInfo: UserNftInfo) => nftInfo?.id?.toString() === selected
                          )

                          // we have the same token selected, so, act like a
                          // toggle and use the default token instead
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
                          <ShowWhenTrue when={nftInfo?.voted}>
                            <div className="text-[11.4px] bg-red-400/20 py-1 px-2 rounded text-red-400 font-bold">
                              Non transferable
                            </div>
                          </ShowWhenTrue>
                          <ShowWhenFalse when={nftInfo?.voted}>
                            <div className="text-[11.4px] bg-green-400/20 py-1 px-2 rounded text-green-400 font-bold">
                              Transferable
                            </div>
                          </ShowWhenFalse>{" "}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </ShowWhenTrue>
          <ShowWhenTrue when={!selectedTokenIsNft}>
            <InputAmount onAmountChange={onAmountChange} amount={amount} />
          </ShowWhenTrue>
        </ShowWhenTrue>

        <ShowWhenTrue when={!isSelectableNft}>
          <InputAmount onAmountChange={onAmountChange} amount={amount} />
        </ShowWhenTrue>
      </div>
      {/* Arrow indicator column */}
      <div>
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
    </div>
  )
}

export default SelectToken

const InputAmount = ({
  onAmountChange,
  amount,
}: {
  onAmountChange: (value: number | undefined) => void
  amount: number | undefined
}) => {
  const ref = useRef<HTMLInputElement>(null)

  return (
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
  )
}
