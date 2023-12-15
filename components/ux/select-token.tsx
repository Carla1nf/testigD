"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Token } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { getAddress } from "viem"
import { Input } from "../ui/input"
import { ShowWhenFalse, ShowWhenTrue } from "./conditionals"
import DisplayToken from "./display-token"

const SelectToken = ({
  amount,
  selectedToken,
  tokens,
  defaultToken,
  onSelectToken,
  onAmountChange,
}: {
  amount: number | undefined
  selectedToken: Token | undefined
  tokens?: Token[]
  defaultToken: Token
  onSelectToken: (token: Token | null) => void
  onAmountChange: (value: number) => void
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex flex-row items-center bg-[#2F2F2F] px-4 py-1 gap-2 rounded-lg w-full">
        <PopoverTrigger asChild>
          <Button variant="create" role="combobox" aria-expanded={open} className="basis-2/3 justify-start pl-1">
            {selectedToken ? (
              <DisplayToken token={selectedToken} size={24} className="text-base font-bold" />
            ) : (
              <span className="text-sm font-normal text-[#757575]">Select token...</span>
            )}
          </Button>
        </PopoverTrigger>
        <div className="grow">
          <Input
            variant="create"
            type="number"
            value={amount ?? ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              if (value && value >= 0) {
                if (onAmountChange) {
                  onAmountChange(value)
                }
              } else {
                if (onAmountChange) {
                  onAmountChange(0)
                }
              }
            }}
            className="px-2 py-1 bg-[#2F2F2F] text-base font-bold tracking-wide text-[#9F9F9F] leading-6"
            placeholder="0"
          />
        </div>
        <ShowWhenTrue when={open}>
          <ChevronUp
            className="h-6 w-6 shrink-0 opacity-50 text-[#D75071] cursor-pointer"
            onClick={() => setOpen(false)}
          />
        </ShowWhenTrue>
        <ShowWhenFalse when={open}>
          <ChevronDown
            className="h-6 w-6 shrink-0 opacity-50 stroke-[#D75071] cursor-pointer"
            onClick={() => setOpen(true)}
          />
        </ShowWhenFalse>
      </div>
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
                  setOpen(false)
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

                <DisplayToken token={token} size={24} className="text-base font-bold" />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SelectToken
