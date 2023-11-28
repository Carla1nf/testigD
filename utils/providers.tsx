"use client"

import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ReactNode, useState } from "react"
import { WagmiConfig, configureChains, createConfig } from "wagmi"
import { fantom } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"

const { chains, publicClient } = configureChains(
  [fantom],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: `https://rough-thrilling-voice.fantom.quiknode.pro/08adfc18cdb46fc87e3cf44a6fad0a81975fb6c4/`,
      }),
    }),
    publicProvider(),
  ]
)

// we need a YOUR_PROJECT_ID for wallet connect
const { connectors } = getDefaultWallets({
  appName: "Dēbita",
  projectId: "YOUR_PROJECT_ID",
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
