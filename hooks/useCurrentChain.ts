export type CurrentChain = {
  name: string
  slug: string
  symbol: string
  defiLlamaSlug: string
}

const useCurrentChain = (): CurrentChain => {
  // we will make this dynamic in the future and support multiple `configured` chains
  return { name: "Fantom network", symbol: "FTM", slug: "fantom", defiLlamaSlug: "fantom" }
}

export default useCurrentChain
