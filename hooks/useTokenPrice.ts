import fetchTokenPrices, { makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"

const useTokenPrice = (chainSlug: string, address: Address) => {
  const uuid = makeLlamaUuid(chainSlug, address)

  const { data, isSuccess: isFetched } = useQuery({
    queryKey: ["token-price", uuid],
    queryFn: () => fetchTokenPrices([uuid]),
  })

  if (isFetched && data) {
    return data.values().next().value
  }

  return undefined
}

export default useTokenPrice
