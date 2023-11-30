import { Token, findInternalTokenBySymbol } from "@/lib/tokens"
import { useEffect, useState } from "react"

export const useInternalToken = (chainSlug: string, symbol: string) => {
  const [token, setToken] = useState<Token | undefined | false>(undefined)

  useEffect(() => {
    const found = findInternalTokenBySymbol(chainSlug, symbol)
    if (found) {
      setToken(found)
    } else {
      setToken(false)
    }
  }, [chainSlug, symbol])

  return token
}
