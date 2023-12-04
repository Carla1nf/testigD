const useCurrentChain = () => {
  // we will make this dynamic in the future and support multiple `configured` chains
  return { name: "Fantom network", slug: "fantom", defiLlamaSlug: "fantom" }
}

export default useCurrentChain
