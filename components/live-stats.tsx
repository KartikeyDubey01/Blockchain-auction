"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, Zap } from "lucide-react"

export default function LiveStats() {
  const [stats, setStats] = useState({
    totalBids: 1247,
    activeUsers: 89,
    totalVolume: 156.7,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        totalBids: prev.totalBids + Math.floor(Math.random() * 3),
        activeUsers: Math.max(50, prev.activeUsers + Math.floor(Math.random() * 4) - 2),
        totalVolume: prev.totalVolume + Math.random() * 0.1,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center space-x-6 text-sm">
      <div className="flex items-center space-x-2 text-cyan-400 animate-pulse">
        <TrendingUp className="w-4 h-4" />
        <span className="font-mono font-bold">{stats.totalBids}</span>
        <span className="text-gray-400">bids</span>
      </div>

      <div className="flex items-center space-x-2 text-pink-400 animate-pulse">
        <Users className="w-4 h-4" />
        <span className="font-mono font-bold">{stats.activeUsers}</span>
        <span className="text-gray-400">online</span>
      </div>

      <div className="flex items-center space-x-2 text-green-400 animate-pulse">
        <Zap className="w-4 h-4" />
        <span className="font-mono font-bold">{stats.totalVolume.toFixed(1)}</span>
        <span className="text-gray-400">ETH</span>
      </div>
    </div>
  )
}
