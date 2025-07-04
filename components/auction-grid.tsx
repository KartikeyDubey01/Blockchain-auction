"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, Zap, Trophy, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import BidWaveAnimation from "@/components/bid-wave-animation"

interface AuctionItem {
  id: number
  name: string
  description: string
  image: string
  currentBid: number
  startingPrice: number
  timeLeft: number
  bidders: number
  isActive: boolean
  lastBidder?: string
}

interface AuctionGridProps {
  walletAddress: string
}

export default function AuctionGrid({ walletAddress }: AuctionGridProps) {
  const [items, setItems] = useState<AuctionItem[]>([
    {
      id: 1,
      name: "Cyber Dragon NFT",
      description: "Legendary digital dragon with plasma breath",
      image: "/placeholder.svg?height=300&width=300",
      currentBid: 2.5,
      startingPrice: 1.0,
      timeLeft: 3600,
      bidders: 12,
      isActive: true,
    },
    {
      id: 2,
      name: "Neon City Artwork",
      description: "Futuristic cityscape with holographic elements",
      image: "/placeholder.svg?height=300&width=300",
      currentBid: 1.8,
      startingPrice: 0.5,
      timeLeft: 7200,
      bidders: 8,
      isActive: true,
    },
    {
      id: 3,
      name: "Quantum Sword",
      description: "Blade forged in the digital realm",
      image: "/placeholder.svg?height=300&width=300",
      currentBid: 4.2,
      startingPrice: 2.0,
      timeLeft: 1800,
      bidders: 15,
      isActive: true,
    },
  ])

  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [showBidWave, setShowBidWave] = useState<number | null>(null)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleBid = (itemId: number) => {
    const bid = Number.parseFloat(bidAmount)
    if (bid > 0) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, currentBid: bid, bidders: item.bidders + 1, lastBidder: walletAddress }
            : item,
        ),
      )
      setShowBidWave(itemId)
      setBidAmount("")
      setSelectedItem(null)

      setTimeout(() => setShowBidWave(null), 2000)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          timeLeft: Math.max(0, item.timeLeft - 1),
        })),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      {/* Live Blockchain Pulse */}
      <motion.div
        className="w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"
        animate={{
          opacity: [0.3, 1, 0.3],
          scaleX: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative"
          >
            {/* Bid Wave Animation */}
            <AnimatePresence>{showBidWave === item.id && <BidWaveAnimation />}</AnimatePresence>

            <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md border-2 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden group">
              {/* Item Image */}
              <div className="relative overflow-hidden">
                <motion.img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-64 object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Time Left Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(item.timeLeft)}</span>
                </div>

                {/* Hot Auction Indicator */}
                {item.bidders > 10 && (
                  <motion.div
                    className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Flame className="w-4 h-4" />
                    <span>HOT</span>
                  </motion.div>
                )}
              </div>

              {/* Item Details */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>

                {/* Bid Info */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Current Bid</p>
                    <p className="text-2xl font-bold text-cyan-400">{item.currentBid} ETH</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Bidders</p>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-pink-400" />
                      <span className="text-pink-400 font-bold">{item.bidders}</span>
                    </div>
                  </div>
                </div>

                {/* Last Bidder */}
                {item.lastBidder && (
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-lg p-3 border border-cyan-500/20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="text-xs text-gray-400 mb-1">Last Bidder</p>
                    <p className="text-cyan-400 font-mono text-sm">
                      {item.lastBidder.slice(0, 6)}...{item.lastBidder.slice(-4)}
                    </p>
                  </motion.div>
                )}

                {/* Bid Section */}
                <AnimatePresence>
                  {selectedItem === item.id ? (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Input
                        type="number"
                        placeholder={`Min: ${item.currentBid + 0.1} ETH`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="bg-black/50 border-cyan-500/30 text-white placeholder-gray-400"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleBid(item.id)}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black font-bold"
                          disabled={!bidAmount || Number.parseFloat(bidAmount) <= item.currentBid}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Place Bid
                        </Button>
                        <Button
                          onClick={() => setSelectedItem(null)}
                          variant="outline"
                          className="border-gray-600 text-gray-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button
                      onClick={() => setSelectedItem(item.id)}
                      className="w-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Place Bid
                    </Button>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
