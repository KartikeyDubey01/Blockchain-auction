"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from "lucide-react"

interface NetworkStatusProps {
  networkInfo: any
  isConnected: boolean
  onSwitchNetwork?: () => void
}

export default function NetworkStatus({ networkInfo, isConnected, onSwitchNetwork }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8545", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 1,
          }),
        })
        setIsOnline(response.ok)
      } catch {
        setIsOnline(false)
      }
    }

    if (isConnected) {
      checkConnection()
      const interval = setInterval(checkConnection, 10000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  if (!isConnected) return null

  const isCorrectNetwork = networkInfo?.chainId === 31337
  const isLocalhost = networkInfo?.isLocalhost

  return (
    <div className="flex items-center space-x-2">
      {/* Network Status */}
      <Badge
        variant="outline"
        className={`${isCorrectNetwork ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400"}`}
      >
        {isCorrectNetwork ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
        {networkInfo?.name || "Unknown"} ({networkInfo?.chainId})
      </Badge>

      {/* Connection Status */}
      <Badge
        variant="outline"
        className={`${isOnline ? "border-cyan-500/50 text-cyan-400" : "border-red-500/50 text-red-400"}`}
      >
        {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
        {isOnline ? "Online" : "Offline"}
      </Badge>

      {/* Switch Network Button */}
      {!isCorrectNetwork && onSwitchNetwork && (
        <Button
          onClick={onSwitchNetwork}
          size="sm"
          variant="outline"
          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
        >
          Switch to Localhost
        </Button>
      )}
    </div>
  )
}
