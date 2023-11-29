"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { ChevronDown } from "lucide-react"

const Connect = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted
        const connected = ready && account && chain
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="debita-gradient py-2 px-4 text-white text-xs font-bold rounded-md"
                  >
                    Connect Wallet
                  </button>
                )
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                )
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  {/* <button onClick={openChainModal} style={{ display: "flex", alignItems: "center" }} type="button">
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: "hidden",
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img alt={chain.name ?? "Chain icon"} src={chain.iconUrl} style={{ width: 12, height: 12 }} />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button> */}
                  <button onClick={openAccountModal} type="button" className="flex flex-row gap-1 items-center">
                    {account.displayBalance ? (
                      <div className="py-2 px-2 bg-black rounded-sm text-xs font-bold">{account.displayBalance}</div>
                    ) : null}
                    <div className="p-2 bg-[#393A3E] rounded-sm text-xs font-bold flex gap-1   justify-between">
                      {account.displayName}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </div>
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export default Connect
