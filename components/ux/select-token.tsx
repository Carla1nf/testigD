"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token, getAllTokens } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import * as React from "react"
import { getAddress } from "viem"
import { ShowWhenFalse, ShowWhenTrue } from "./conditionals"
import DisplayToken from "./display-token"

const SelectToken = ({
  defaultToken,
  onSelectToken,
}: {
  defaultToken: Token
  onSelectToken: (token: Token | null) => void
}) => {
  const currentChain = useCurrentChain()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultToken?.address ?? "")
  const [token, setToken] = React.useState<Token | null>(defaultToken)

  const tokens = React.useMemo(() => {
    // clear selected token when the chain changes
    setToken(null)
    const all = getAllTokens(currentChain.slug)
    all.sort((a, b) => {
      return a.symbol.localeCompare(b.symbol)
    })
    return all
  }, [currentChain.slug])

  console.log("defaultToken", defaultToken)
  console.log("token", token)
  console.log("value", value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className=" justify-between">
          {token ? <DisplayToken token={token} size={24} /> : <span>Select token...</span>}
          <ShowWhenTrue when={open}>
            <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50 text-[#D75071]" />
          </ShowWhenTrue>
          <ShowWhenFalse when={open}>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 stroke-[#D75071] stroke-2" />
          </ShowWhenFalse>
        </Button>
      </PopoverTrigger>
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
          onValueChange={(value) => {
            console.log("onValueChange, value", value)
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
                    // we have the same token selected, so, act like a toggle and unselect it
                    setValue("")
                    setToken(null)
                    // notify the outside world
                    if (onSelectToken) {
                      onSelectToken(null)
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

                <DisplayToken token={item} size={24} />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SelectToken
