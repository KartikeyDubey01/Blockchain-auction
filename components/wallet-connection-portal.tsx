"use client"

import { useState } from "react"
import { X, Wallet, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WalletConnectionPortalProps {
  onConnect: () => Promise<void>
  onClose: () => void
}

export default function WalletConnectionPortal({ onConnect, onClose }: WalletConnectionPortalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)

  const wallets = [
    { name: "MetaMask", icon: "🦊", color: "from-orange-500 to-yellow-500" },
    { name: "WalletConnect", icon: "🔗", color: "from-blue-500 to-cyan-500" },
    { name: "Coinbase", icon: "🔵", color: "from-blue-600 to-blue-400" },
  ]

  const handleConnect = async (walletName: string) => {
    if (isConnecting) return // Prevent multiple clicks

    setSelectedWallet(walletName)
    setIsConnecting(true)

    try {
      await onConnect()
    } catch (err) {
      console.error("Connection failed:", err)
      setIsConnecting(false)
      setSelectedWallet(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4">
        {/* Glowing Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse" />

        <Card className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl p-8 backdrop-blur-md">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin-slow">
              <Wallet className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-3xl font-bold cyber-text mb-2">Connect Wallet</h2>
            <p className="text-gray-400">Choose your portal to the blockchain realm</p>
          </div>

          {!isConnecting ? (
            <div className="space-y-4">
              {wallets.map((wallet, index) => (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  disabled={isConnecting}
                  className={`w-full p-4 rounded-xl bg-gradient-to-r ${wallet.color} bg-opacity-10 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group animate-slide-up disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{wallet.icon}</div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
                        {wallet.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {isConnecting && selectedWallet === wallet.name
                          ? "Connecting..."
                          : `Connect with ${wallet.name}`}
                      </p>
                    </div>
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">Connecting to {selectedWallet}</h3>
              <p className="text-gray-400">Establishing secure connection...</p>

              {/* Connection Steps */}
              <div className="mt-6 space-y-2">
                {["Initializing...", "Verifying wallet...", "Establishing connection..."].map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center space-x-2 text-sm text-gray-400 animate-slide-up"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
