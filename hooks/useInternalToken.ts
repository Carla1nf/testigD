import { Token, findInternalTokenBySymbol } from "@/utils/tokens"
import { useEffect, useState } from "react"

export const useInternalToken = (chainSlug: string, symbol: string) => {
  const [token, setToken] = useState<Token | undefined>(undefined)

  useEffect(() => {
    const found = findInternalTokenBySymbol(chainSlug, symbol)
    if (found) {
      setToken(found)
    } else {
      setToken(undefined)
    }
  }, [chainSlug, symbol])

  return token
}
