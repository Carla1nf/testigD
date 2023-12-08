export type CurrentChain = {
  name: string
  slug: string
  symbol: string
  defiLlamaSlug: string
  chainId: number
}

const useCurrentChain = (): CurrentChain => {
  // we will make this dynamic in the future and support multiple `configured` chains
  return { name: "Fantom network", symbol: "FTM", slug: "fantom", defiLlamaSlug: "fantom", chainId: 250 }
}

export default useCurrentChain
