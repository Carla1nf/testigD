"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token, getAllTokens } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { getAddress } from "viem"
import { Input } from "../ui/input"
import { ShowWhenFalse, ShowWhenTrue } from "./conditionals"
import DisplayToken from "./display-token"

const SelectToken = ({
  defaultToken,
  onSelectToken,
  onTokenValueChange,
}: {
  defaultToken: Token
  onSelectToken: (token: Token | null) => void
  onTokenValueChange: (value: number) => void
}) => {
  const currentChain = useCurrentChain()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultToken?.address ?? "")
  const [token, setToken] = useState<Token | null>(defaultToken)
  const [tokenValue, setTokenValue] = useState<number | null>(null)

  const tokens = useMemo(() => {
    // clear selected token when the chain changes
    setToken(null)

    // refresh tokens when the chain changes
    const all = getAllTokens(currentChain.slug)
    all.sort((a, b) => {
      return a.symbol.localeCompare(b.symbol)
    })
    return all
  }, [currentChain.slug])

  // it sucks that we need to do this, I would prefer it if react useState used the value passed on first render
  useEffect(() => {
    setToken(defaultToken)
    // if (onSelectToken) {
    //   onSelectToken(defaultToken)
    // }
  }, [defaultToken, onSelectToken])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex flex-row items-center bg-[#2F2F2F] px-4 py-1 gap-2 rounded-lg w-full">
        <PopoverTrigger asChild>
          <Button variant="create" role="combobox" aria-expanded={open} className="basis-2/3 justify-start pl-1">
            {token ? (
              <DisplayToken token={token} size={24} className="text-base font-bold" />
            ) : (
              <span className="text-sm font-normal text-[#757575]">Select token...</span>
            )}
          </Button>
        </PopoverTrigger>
        <div className="grow">
          <Input
            variant="create"
            type="number"
            value={tokenValue ?? ""}
            onChange={(e) => {
              const value = e.target.value
              if (value) {
                setTokenValue(e.target.value)
                if (onTokenValueChange) {
                  onTokenValueChange(e.target.value)
                }
              } else {
                setTokenValue(null)
                if (onTokenValueChange) {
                  onTokenValueChange(0)
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
            const token = tokens.find((token) => getAddress(token.address) === getAddress(itemAddress))
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
            {tokens.map((item) => (
              <CommandItem
                key={item.address}
                value={item.address}
                onSelect={(currentValue) => {
                  // if we have a new token selected
                  if (currentValue !== value) {
                    setValue(currentValue)
                    setToken(item)
                    // notify the outside world
                    if (onSelectToken) {
                      onSelectToken(item)
                    }
                  } else {
                    // we have the same token selected, so, act like a toggle and use the default token instead
                    setValue(defaultToken.address ?? "")
                    setToken(defaultToken)
                    // notify the outside world
                    if (onSelectToken) {
                      onSelectToken(defaultToken)
                    }
                  }
                  setOpen(false)
                }}
              >
                <ShowWhenTrue when={value ? getAddress(value) === item.address : false}>
                  <Check className={cn("mr-2 h-4 w-4", "opacity-100")} />
                </ShowWhenTrue>
                <ShowWhenFalse when={value ? getAddress(value) === item.address : false}>
                  <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                </ShowWhenFalse>

                <DisplayToken token={item} size={24} className="text-base font-bold" />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SelectToken
