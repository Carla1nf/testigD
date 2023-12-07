import { SECONDS_PER_MINUTE } from "@/lib/display"
import { fetchHistoricPrices, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"

const useHistoricalTokenPrices = (chainSlug: string, address: Address, times = 5) => {
  const uuid = makeLlamaUuid(chainSlug, address)
  const { data, isSuccess: isFetched } = useQuery({
    queryKey: ["historical-token-prices", chainSlug, address, times],
    queryFn: () => {
      if (address) {
        return fetchHistoricPrices(uuid, times)
      }
      return null
    },
    staleTime: SECONDS_PER_MINUTE * 5,
  })

  if (isFetched && data) {
    return data
  }

  return undefined
}

export default useHistoricalTokenPrices
