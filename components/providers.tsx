"use client"

import { RainbowKitProvider, connectorsForWallets, darkTheme } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ReactNode, useState } from "react"
import { WagmiConfig, configureChains, createConfig } from "wagmi"
import { fantom } from "wagmi/chains"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"
import { publicProvider } from "wagmi/providers/public"

import {
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { DeadlineNext } from "@/context/next-payment-context"

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

const projectId = "YOUR_PROJECT_ID"
const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      rabbyWallet({ chains }),
      metaMaskWallet({ projectId, chains }),
      injectedWallet({ chains }),
      rainbowWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
    ],
  },
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <QueryClientProvider client={queryClient}>
          <DeadlineNext>{children}</DeadlineNext>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
