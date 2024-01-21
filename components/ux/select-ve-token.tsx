"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import useCurrentChain from "@/hooks/useCurrentChain"
import { UserNftInfo } from "@/hooks/useNftInfo"
import { yesNo } from "@/lib/display"
import { Token, nftUnderlyingToken } from "@/lib/tokens"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useRef, useState } from "react"
import { Input } from "../ui/input"
import { ShowWhenFalse, ShowWhenTrue } from "./conditionals"
import DisplayNftToken from "./display-nft-token"
import DisplayToken from "./display-token"

const SelectVeToken = ({
  token,
  selectedUserNft,
  onSelectUserNft,
  userNftInfo,
}: {
  token?: Token
  selectedUserNft: UserNftInfo | undefined
  onSelectUserNft: (nftInfo: UserNftInfo | null) => void
  userNftInfo?: any
}) => {
  const currentChain = useCurrentChain()
  const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false)
  const [isNftPopupOpen, setIsNftPopupOpen] = useState(false)
  const underlying = token ? nftUnderlyingToken(token, currentChain.slug) : undefined

  return (
    <Popover open={isNftPopupOpen} onOpenChange={setIsNftPopupOpen}>
      <PopoverTrigger asChild>
        <div className="grid grid-cols-[1fr_24px] items-center justify-between bg-[#2F2F2F] px-4 py-1 gap-2 rounded-lg w-full">
          {/* Token / NFT selection column */}
          <div className="flex flex-row justify-between items-center">
            <Button variant="create" role="combobox" aria-expanded={isNftPopupOpen} className="pl-1 text-sm space-x-2">
              <ShowWhenFalse when={Boolean(selectedUserNft)}>
                <DisplayNftToken token={token} size={20} className="text-sm" chainSlug={currentChain.slug} />
              </ShowWhenFalse>
              <ShowWhenTrue when={Boolean(selectedUserNft)}>
                <div className="flex flex-row gap-2 items-center">
                  <DisplayNftToken token={token} size={20} className="text-sm" chainSlug={currentChain.slug} />
                  <div className="text-sm whitespace-nowrap">#{selectedUserNft?.id}</div>
                  <div>-</div>
                  <div className="text-sm whitespace-nowrap">
                    {selectedUserNft?.amount.toFixed(2)} Locked {underlying?.symbol ?? ""}
                  </div>
                </div>
              </ShowWhenTrue>
            </Button>
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
                  {/* {selectedToken ? (
                        <DisplayToken
                          token={selectedToken}
                          size={20}
                          className="text-base"
                          chainSlug={currentChain.slug}
                        />
                      ) : null} */}

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
  )
}

export default SelectVeToken
