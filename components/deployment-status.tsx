"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, AlertTriangle, Copy } from "lucide-react"

interface DeploymentStatusProps {
  deploymentInfo: any
  contractAddress: string
  onRefresh: () => Promise<boolean>
  isConnected: boolean
}

export default function DeploymentStatus({
  deploymentInfo,
  contractAddress,
  onRefresh,
  isConnected,
}: DeploymentStatusProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const found = await onRefresh()
      if (found) {
        console.log("✅ Deployment refreshed successfully")
      }
    } catch (err) {
      console.error("❌ Failed to refresh deployment:", err)
    } finally {
      setRefreshing(false)
    }
  }

  const copyAddress = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasDeployment = !!(deploymentInfo && contractAddress)

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-cyan-500/20 mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            {hasDeployment ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            <span>Contract Deployment Status</span>
          </h3>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Detecting..." : "Refresh"}
          </Button>
        </div>

        {hasDeployment ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Contract Address</p>
                <div className="flex items-center space-x-2">
                  <code className="text-cyan-400 font-mono text-sm break-all">{contractAddress}</code>
                  <Button
                    onClick={copyAddress}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {copied && <span className="text-green-400 text-xs">Copied!</span>}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Network</p>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{deploymentInfo.network}</span>
                  <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                    Chain ID: {deploymentInfo.chainId}
                  </Badge>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Deployed By</p>
                <code className="text-pink-400 font-mono text-sm">
                  {deploymentInfo.deployerAddress?.slice(0, 10)}...{deploymentInfo.deployerAddress?.slice(-6)}
                </code>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Deployment Time</p>
                <span className="text-white text-sm">
                  {deploymentInfo.deploymentTime ? new Date(deploymentInfo.deploymentTime).toLocaleString() : "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">Contract Auto-Detected</span>
              </div>
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                Ready
              </Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">No Contract Deployment Found</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Deploy your smart contract to enable blockchain functionality.
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Deployment Commands</p>
                <div className="space-y-1">
                  <code className="block text-cyan-400 text-sm bg-black/50 p-2 rounded">npx hardhat node</code>
                  <code className="block text-cyan-400 text-sm bg-black/50 p-2 rounded">
                    npx hardhat run scripts/deploy.js --network localhost
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
