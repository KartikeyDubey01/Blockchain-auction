"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowLeft, Plus, Trash2, Pause } from "lucide-react"
import { useWeb3 } from "@/hooks/useWeb3"
import { formatEther } from "@/utils/web3"

interface ScheduledBid {
  id: string
  itemId: number
  itemName: string
  bidAmount: string
  bidderName: string
  scheduledTime: Date
  status: "pending" | "executed" | "failed" | "cancelled"
  maxGasPrice?: string
}

export default function SchedulerPage() {
  const { isConnected, account, connectWallet, getAllItems, placeBid } = useWeb3()
  const [items, setItems] = useState<any[]>([])
  const [scheduledBids, setScheduledBids] = useState<ScheduledBid[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    itemId: "",
    bidAmount: "",
    bidderName: "",
    scheduledDate: "",
    scheduledTime: "",
    maxGasPrice: "20",
  })

  // Load items and scheduled bids
  useEffect(() => {
    const loadData = async () => {
      if (isConnected) {
        try {
          const allItems = await getAllItems()
          setItems(allItems.filter((item) => item.active))
        } catch (err) {
          console.error("Error loading items:", err)
        }
      }
    }
    loadData()

    // Load scheduled bids from localStorage
    const saved = localStorage.getItem("scheduledBids")
    if (saved) {
      const parsed = JSON.parse(saved)
      setScheduledBids(
        parsed.map((bid: any) => ({
          ...bid,
          scheduledTime: new Date(bid.scheduledTime),
        })),
      )
    }
  }, [isConnected])

  // Save scheduled bids to localStorage
  useEffect(() => {
    localStorage.setItem("scheduledBids", JSON.stringify(scheduledBids))
  }, [scheduledBids])

  // Check and execute scheduled bids
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      scheduledBids.forEach(async (bid) => {
        if (bid.status === "pending" && bid.scheduledTime <= now) {
          try {
            await placeBid(bid.itemId, bid.bidderName, bid.bidAmount)
            setScheduledBids((prev) => prev.map((b) => (b.id === bid.id ? { ...b, status: "executed" as const } : b)))
          } catch (err) {
            console.error("Scheduled bid failed:", err)
            setScheduledBids((prev) => prev.map((b) => (b.id === bid.id ? { ...b, status: "failed" as const } : b)))
          }
        }
      })
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [scheduledBids, placeBid])

  const handleScheduleBid = () => {
    if (
      !newSchedule.itemId ||
      !newSchedule.bidAmount ||
      !newSchedule.bidderName ||
      !newSchedule.scheduledDate ||
      !newSchedule.scheduledTime
    ) {
      alert("Please fill in all fields")
      return
    }

    const scheduledTime = new Date(`${newSchedule.scheduledDate}T${newSchedule.scheduledTime}`)
    if (scheduledTime <= new Date()) {
      alert("Scheduled time must be in the future")
      return
    }

    const selectedItem = items.find((item) => item.itemId.toString() === newSchedule.itemId)
    const minBid = Number(formatEther(selectedItem?.highestBid || selectedItem?.startingPrice || "0")) + 0.01

    if (Number(newSchedule.bidAmount) < minBid) {
      alert(`Bid amount must be at least ${minBid.toFixed(2)} ETH`)
      return
    }

    const newBid: ScheduledBid = {
      id: Date.now().toString(),
      itemId: Number(newSchedule.itemId),
      itemName: selectedItem?.itemName || "Unknown Item",
      bidAmount: newSchedule.bidAmount,
      bidderName: newSchedule.bidderName,
      scheduledTime,
      status: "pending",
      maxGasPrice: newSchedule.maxGasPrice,
    }

    setScheduledBids((prev) => [...prev, newBid])
    setNewSchedule({
      itemId: "",
      bidAmount: "",
      bidderName: "",
      scheduledDate: "",
      scheduledTime: "",
      maxGasPrice: "20",
    })
    setShowScheduleForm(false)
  }

  const cancelScheduledBid = (id: string) => {
    setScheduledBids((prev) => prev.map((bid) => (bid.id === id ? { ...bid, status: "cancelled" as const } : bid)))
  }

  const deleteScheduledBid = (id: string) => {
    setScheduledBids((prev) => prev.filter((bid) => bid.id !== id))
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/30 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold cyber-text mb-4">Bid Scheduler</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to schedule automated bids</p>
            <Button
              onClick={connectWallet}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
            >
              Connect Wallet
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20 cyber-grid animate-pulse"></div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-purple-500/20 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold cyber-text">Bid Scheduler</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Account:{" "}
              <span className="text-purple-400 font-mono">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Auctions
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Schedule New Bid Section */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-purple-500/20 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Schedule New Bid</h2>
              <Button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showScheduleForm ? "Cancel" : "Schedule Bid"}
              </Button>
            </div>

            {showScheduleForm && (
              <div className="space-y-4 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Select Item</label>
                    <select
                      value={newSchedule.itemId}
                      onChange={(e) => setNewSchedule({ ...newSchedule, itemId: e.target.value })}
                      className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select an auction item</option>
                      {items.map((item) => (
                        <option key={item.itemId} value={item.itemId}>
                          {item.itemName} (Min:{" "}
                          {(Number(formatEther(item.highestBid || item.startingPrice)) + 0.01).toFixed(2)} ETH)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bid Amount (ETH)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newSchedule.bidAmount}
                      onChange={(e) => setNewSchedule({ ...newSchedule, bidAmount: e.target.value })}
                      placeholder="0.1"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bidder Name</label>
                    <Input
                      value={newSchedule.bidderName}
                      onChange={(e) => setNewSchedule({ ...newSchedule, bidderName: e.target.value })}
                      placeholder="Your name"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                    <Input
                      type="date"
                      value={newSchedule.scheduledDate}
                      onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                    <Input
                      type="time"
                      value={newSchedule.scheduledTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, scheduledTime: e.target.value })}
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleScheduleBid}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Bid
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Scheduled Bids */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold cyber-text">Scheduled Bids</h2>

          {scheduledBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledBids.map((bid) => (
                <Card
                  key={bid.id}
                  className="bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white">{bid.itemName}</h3>
                        <p className="text-gray-400 text-sm">by {bid.bidderName}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          bid.status === "pending"
                            ? "border-yellow-500/50 text-yellow-400"
                            : bid.status === "executed"
                              ? "border-green-500/50 text-green-400"
                              : bid.status === "failed"
                                ? "border-red-500/50 text-red-400"
                                : "border-gray-500/50 text-gray-400"
                        }`}
                      >
                        {bid.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Bid Amount:</span>
                        <span className="text-purple-400 font-bold">{bid.bidAmount} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Scheduled:</span>
                        <span className="text-white text-sm">
                          {bid.scheduledTime.toLocaleDateString()} {bid.scheduledTime.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Time Left:</span>
                        <span className="text-cyan-400 text-sm">
                          {bid.scheduledTime > new Date()
                            ? `${Math.ceil((bid.scheduledTime.getTime() - new Date().getTime()) / (1000 * 60))} min`
                            : "Overdue"}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {bid.status === "pending" && (
                        <Button
                          onClick={() => cancelScheduledBid(bid.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteScheduledBid(bid.id)}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Scheduled Bids</h3>
              <p className="text-gray-500">Schedule your first automated bid to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
