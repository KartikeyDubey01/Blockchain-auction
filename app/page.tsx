"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Wallet, Zap, Trophy, Clock, Flame, TrendingUp, Activity, Calendar, Plus } from "lucide-react"
import dynamic from "next/dynamic"
import { useWeb3 } from "@/hooks/useWeb3"
import { formatEther } from "@/utils/web3"
import { ItemListSkeleton, LoadingSpinner } from "@/components/loading-skeleton"

// Dynamically import components that might cause hydration issues
const WalletConnectionPortal = dynamic(() => import("@/components/wallet-connection-portal"), {
  ssr: false,
})

const BlockchainVisualization = dynamic(() => import("@/components/blockchain-visualization"), {
  ssr: false,
})

const LiveStats = dynamic(() => import("@/components/live-stats"), {
  ssr: false,
})

const DeploymentStatus = dynamic(() => import("@/components/deployment-status"), {
  ssr: false,
})

export default function HomePage() {
  const {
    isConnected,
    account,
    connectWallet,
    placeBid,
    getAllItems,
    loading,
    error,
    isMockMode,
    isContractReady,
    deploymentInfo,
    contractAddress,
    refreshDeployment,
  } = useWeb3()

  const [items, setItems] = useState<any[]>([])
  const [showPortal, setShowPortal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load auction items with optimistic updates
  const loadItems = useCallback(
    async (showLoader = false) => {
      if (!isConnected) {
        console.log("Wallet not connected, skipping item load")
        setItems([])
        setInitialLoading(false)
        return
      }

      if (showLoader) {
        setRefreshing(true)
      }

      try {
        const allItems = await getAllItems()
        setItems(allItems || [])
        console.log("✅ Loaded items:", allItems?.length || 0)
      } catch (err) {
        console.error("Error loading items:", err)
        // Don't clear existing items on error
      } finally {
        setRefreshing(false)
        setInitialLoading(false)
      }
    },
    [isConnected, getAllItems],
  )

  // Initial load
  useEffect(() => {
    if (mounted && isConnected && isContractReady) {
      loadItems(false) // Don't show loader on initial load
    } else if (mounted && !isConnected) {
      setInitialLoading(false)
    }
  }, [mounted, isConnected, isContractReady, loadItems])

  // Auto-refresh every 45 seconds (less frequent to reduce load)
  useEffect(() => {
    if (mounted && isConnected && isContractReady && !isMockMode) {
      const interval = setInterval(() => {
        loadItems(false) // Background refresh without loader
      }, 45000) // 45 seconds
      return () => clearInterval(interval)
    }
  }, [mounted, isConnected, isContractReady, isMockMode, loadItems])

  const handleWalletConnect = async () => {
    try {
      await connectWallet()
      setShowPortal(false)
    } catch (err) {
      console.error("Wallet connection failed:", err)
    }
  }

  const handleBid = async (itemId: number, bidAmount: string, bidderName: string) => {
    try {
      await placeBid(itemId, bidderName, bidAmount)
      // Optimistic update will handle UI changes immediately
      // Background sync will confirm the changes
      setTimeout(() => loadItems(false), 2000) // Refresh after 2 seconds
    } catch (err) {
      console.error("Bid failed:", err)
    }
  }

  const handleManualRefresh = () => {
    loadItems(true) // Show loader for manual refresh
  }

  // Don't render dynamic content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-cyan-400 text-lg mt-4">Loading BlockBid Arena...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20 cyber-grid animate-pulse"></div>

      {/* Floating Particles - Only render after mount */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Blockchain Pulse */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center space-x-2 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-full px-4 py-2 animate-pulse-glow">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-cyan-400 text-sm font-mono font-bold tracking-wider">
            {isConnected ? (isMockMode ? "DEMO MODE" : "BLOCKCHAIN CONNECTED") : "BLOCKCHAIN OFFLINE"}
          </span>
          <div className={`w-2 h-2 rounded-full animate-ping ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-cyan-500/20 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-pink-500 rounded-lg flex items-center justify-center animate-spin-slow">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold cyber-text">BlockBid Arena</h1>
            {isMockMode && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                DEMO
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {mounted && <LiveStats />}

            {!isConnected ? (
              <Button
                onClick={() => setShowPortal(true)}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black font-bold px-6 py-2 rounded-lg shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/50 animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {loading ? "Connecting..." : "Connect Wallet"}
              </Button>
            ) : (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 backdrop-blur-md rounded-lg px-4 py-2 border border-cyan-500/30 animate-pulse-glow">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-cyan-400 font-mono text-sm">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
            )}

            <Button
              onClick={() => (window.location.href = "/admin")}
              variant="outline"
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Admin
            </Button>

            <Button
              onClick={() => (window.location.href = "/scheduler")}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Deployment Status */}
        {mounted && (
          <DeploymentStatus
            deploymentInfo={deploymentInfo}
            contractAddress={contractAddress}
            onRefresh={refreshDeployment}
            isConnected={isConnected}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-20">
            <h2 className="text-6xl font-bold mb-6 cyber-text">Welcome to the Future</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Experience the next generation of blockchain auctions with real smart contract integration, scheduled
              bidding, and immersive visuals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { icon: Trophy, title: "Smart Contracts", desc: "Powered by Ethereum blockchain" },
                { icon: Calendar, title: "Scheduled Bids", desc: "Set up automated bidding strategies" },
                { icon: Flame, title: "Real-time Updates", desc: "Live blockchain synchronization" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-cyan-500/10 to-pink-500/10 backdrop-blur-md rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 animate-float"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <feature.icon className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {mounted && <BlockchainVisualization />}
          </div>
        ) : (
          <div>
            {/* Refresh Button */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold cyber-text">Live Auctions</h2>
              <Button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
              >
                {refreshing ? <LoadingSpinner size="sm" /> : <Activity className="w-4 h-4" />}
                <span className="ml-2">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </Button>
            </div>

            {/* Auction Items Grid */}
            {initialLoading ? (
              <ItemListSkeleton count={6} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <AuctionCard
                      key={`${item.itemId}-${item.isOptimistic ? "opt" : "real"}`}
                      item={item}
                      onBid={handleBid}
                      userAccount={account}
                      index={index}
                      isMockMode={isMockMode}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No Auctions Available</h3>
                    <p className="text-gray-500">Check back later or contact the admin to add new items.</p>
                  </div>
                )}
              </div>
            )}

            {/* Stats section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Total Items", value: items.length.toString(), icon: TrendingUp, color: "text-cyan-400" },
                {
                  label: "Active Auctions",
                  value: items.filter((item) => item.active).length.toString(),
                  icon: Clock,
                  color: "text-pink-400",
                },
                {
                  label: "Total Volume",
                  value: `${items.reduce((sum, item) => sum + Number(formatEther(item.highestBid || "0")), 0).toFixed(2)} ETH`,
                  icon: Zap,
                  color: "text-green-400",
                },
                {
                  label: "Completed",
                  value: items.filter((item) => !item.active).length.toString(),
                  icon: Trophy,
                  color: "text-yellow-400",
                },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="bg-black/50 border-cyan-500/20 hover:border-cyan-500/60 transition-all duration-300 animate-pulse-glow"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="p-6 text-center">
                    <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3 animate-pulse`} />
                    <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wallet Connection Portal */}
      {mounted && showPortal && (
        <WalletConnectionPortal onConnect={handleWalletConnect} onClose={() => setShowPortal(false)} />
      )}
    </div>
  )
}

// Auction Card Component with optimistic updates
function AuctionCard({ item, onBid, userAccount, index, isMockMode }: any) {
  const [bidAmount, setBidAmount] = useState("")
  const [bidderName, setBidderName] = useState("")
  const [showBidForm, setShowBidForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBid = async () => {
    if (bidAmount && bidderName) {
      setIsSubmitting(true)
      try {
        await onBid(item.itemId, bidAmount, bidderName)
        setShowBidForm(false)
        setBidAmount("")
        setBidderName("")
      } catch (err) {
        console.error("Bid submission failed:", err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const isUserHighestBidder = item.highestBidder?.toLowerCase() === userAccount?.toLowerCase()
  const minBidAmount = Number(formatEther(item.highestBid || item.startingPrice)) + 0.01
  const isOptimistic = item.isOptimistic || item.isPending

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 border-2 ${
        isOptimistic ? "border-yellow-500/40 shadow-yellow-500/20" : "border-cyan-500/20 hover:border-cyan-500/60"
      } transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 group animate-slide-up`}
    >
      {/* Optimistic indicator */}
      {isOptimistic && (
        <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse z-10">
          <LoadingSpinner size="sm" />
          <span>PENDING</span>
        </div>
      )}

      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Winner badge */}
      {isUserHighestBidder && !isOptimistic && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse z-10">
          <Trophy className="w-3 h-3" />
          <span>WINNING</span>
        </div>
      )}

      {/* Demo badge */}
      {isMockMode && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
          DEMO
        </div>
      )}

      <div className="relative p-6 space-y-4">
        {/* Item Image Placeholder */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-500/20 to-pink-500/20 h-48 flex items-center justify-center">
          <div className="text-6xl opacity-50">🎨</div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* Header with status */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 font-mono tracking-wide cyber-text">{item.itemName}</h3>
            <p className="text-gray-400 text-sm">{item.itemDescription}</p>
          </div>
          <Badge
            variant={item.active ? "default" : "secondary"}
            className={`${
              item.active
                ? "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse"
                : "bg-red-500/20 text-red-400 border-red-500/50"
            }`}
          >
            {item.active ? "LIVE" : "ENDED"}
          </Badge>
        </div>

        {/* Price display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/50 rounded-lg p-3 border border-gray-700 hover:border-cyan-500/50 transition-colors">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Starting Price</p>
            <p className="text-cyan-400 font-bold text-lg font-mono">{formatEther(item.startingPrice)} ETH</p>
          </div>
          <div className="bg-black/50 rounded-lg p-3 border border-pink-500/30 relative overflow-hidden hover:border-pink-500/60 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent"></div>
            <p className="text-gray-400 text-xs uppercase tracking-wider relative z-10">Highest Bid</p>
            <p className="text-pink-400 font-bold text-lg font-mono relative z-10 flex items-center">
              <Flame className="w-4 h-4 mr-1 animate-pulse" />
              {item.highestBid ? formatEther(item.highestBid) : "0"} ETH
            </p>
          </div>
        </div>

        {/* Bidder info */}
        {item.bidderName && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{item.bidderName}</p>
              <p className="text-gray-400 text-xs">
                {item.highestBidder?.slice(0, 6)}...{item.highestBidder?.slice(-4)}
              </p>
            </div>
          </div>
        )}

        {/* Bid button and form */}
        {item.active && (
          <div className="space-y-3">
            {!showBidForm ? (
              <Button
                onClick={() => setShowBidForm(true)}
                disabled={isOptimistic}
                className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isOptimistic ? "PROCESSING..." : isMockMode ? "PLACE BID (DEMO)" : "PLACE BID"}
              </Button>
            ) : (
              <div className="space-y-3 bg-black/30 p-4 rounded-lg border border-cyan-500/30 animate-slide-up">
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={bidderName}
                  onChange={(e) => setBidderName(e.target.value)}
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Min: ${minBidAmount.toFixed(2)} ETH`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleBid}
                    disabled={!bidAmount || !bidderName || Number(bidAmount) < minBidAmount || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" /> : <Activity className="w-4 h-4" />}
                    <span className="ml-2">
                      {isSubmitting ? "SUBMITTING..." : isMockMode ? "CONFIRM (DEMO)" : "CONFIRM BID"}
                    </span>
                  </Button>
                  <Button
                    onClick={() => setShowBidForm(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={isSubmitting}
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
