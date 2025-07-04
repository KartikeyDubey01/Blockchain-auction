"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, Trash2, StopCircle, ArrowLeft, Zap, AlertTriangle } from "lucide-react"
import { useWeb3 } from "@/hooks/useWeb3"
import { formatEther } from "@/utils/web3"
import { LoadingSpinner, ItemListSkeleton } from "@/components/loading-skeleton"

export default function AdminPage() {
  const {
    isConnected,
    account,
    contract,
    connectWallet,
    addItem,
    endAuction,
    getAllItems,
    loading,
    error,
    isOwner,
    isMockMode,
  } = useWeb3()

  const [items, setItems] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    startingPrice: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const loadItems = async () => {
    if (isConnected) {
      try {
        const allItems = await getAllItems()
        setItems(allItems || [])
        console.log("✅ Admin loaded items:", allItems?.length || 0)
      } catch (err) {
        console.error("Error loading items:", err)
        setItems([])
      } finally {
        setInitialLoading(false)
      }
    } else {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [isConnected])

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.description || !newItem.startingPrice) {
      alert("Please fill in all fields")
      return
    }

    setSubmitting(true)
    try {
      const result = await addItem(newItem.name, newItem.description, newItem.startingPrice)

      // Optimistic update - add item immediately to UI
      if (result) {
        setItems((prev) => [result, ...prev])
      }

      setNewItem({ name: "", description: "", startingPrice: "" })
      setShowAddForm(false)

      // Refresh items after a short delay to get real data
      setTimeout(() => loadItems(), 2000)
    } catch (err) {
      console.error("Failed to add item:", err)
      alert("Failed to add item. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEndAuction = async (itemId: number) => {
    if (confirm("Are you sure you want to end this auction?")) {
      try {
        await endAuction(itemId)

        // Optimistic update - mark item as ended immediately
        setItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, active: false } : item)))

        // Refresh items after a short delay
        setTimeout(() => loadItems(), 2000)
      } catch (err) {
        console.error("Failed to end auction:", err)
        alert("Failed to end auction. Please try again.")
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="fixed inset-0 opacity-20 cyber-grid animate-pulse"></div>
        <Card className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Settings className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold cyber-text mb-4">Admin Panel</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to access admin functions</p>
            <Button
              onClick={connectWallet}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black font-bold"
            >
              {loading ? <LoadingSpinner size="sm" /> : <span>Connect Wallet</span>}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!isOwner && !isMockMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="fixed inset-0 opacity-20 cyber-grid animate-pulse"></div>
        <Card className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Trash2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-6">Only the contract owner can access this admin panel</p>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Auctions
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
      <div className="relative z-10 p-6 border-b border-cyan-500/20 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold cyber-text">Admin Panel</h1>
            {isMockMode && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                DEMO MODE
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {isMockMode ? "Demo" : "Owner"}:{" "}
              <span className="text-cyan-400 font-mono">
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

      {/* Mock Mode Warning */}
      {isMockMode && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-yellow-400 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <strong>Demo Mode:</strong> No smart contract deployed. All actions are simulated for demonstration
              purposes.
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Add Item Section */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-cyan-500/20 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add New Auction Item</h2>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showAddForm ? "Cancel" : "Add Item"}
              </Button>
            </div>

            {showAddForm && (
              <div className="space-y-4 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Item Name</label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Enter item name"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Starting Price (ETH)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.startingPrice}
                      onChange={(e) => setNewItem({ ...newItem, startingPrice: e.target.value })}
                      placeholder="0.1"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter item description"
                    className="bg-black/50 border-gray-600 text-white"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAddItem}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
                  <span className="ml-2">
                    {submitting ? "Adding Item..." : isMockMode ? "Add Item (Demo)" : "Add Item to Blockchain"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Items Management */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold cyber-text">Manage Auction Items</h2>

          {initialLoading ? (
            <ItemListSkeleton count={3} />
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => (
                <Card
                  key={`${item.itemId}-${item.isOptimistic ? "opt" : "real"}`}
                  className={`bg-gradient-to-br from-gray-900/90 to-black/90 border-2 ${
                    item.isOptimistic || item.isPending
                      ? "border-yellow-500/40 shadow-yellow-500/20"
                      : "border-cyan-500/20 hover:border-cyan-500/40"
                  } transition-all duration-300`}
                >
                  <div className="p-6 space-y-4">
                    {/* Optimistic indicator */}
                    {(item.isOptimistic || item.isPending) && (
                      <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white">{item.itemName}</h3>
                        <p className="text-gray-400 text-sm">{item.itemDescription}</p>
                      </div>
                      <Badge
                        variant={item.active ? "default" : "secondary"}
                        className={`${
                          item.active
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}
                      >
                        {item.active ? "ACTIVE" : "ENDED"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs">Starting Price</p>
                        <p className="text-cyan-400 font-bold">{formatEther(item.startingPrice)} ETH</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Highest Bid</p>
                        <p className="text-pink-400 font-bold">
                          {item.highestBid ? formatEther(item.highestBid) : "0"} ETH
                        </p>
                      </div>
                    </div>

                    {item.bidderName && (
                      <div>
                        <p className="text-gray-400 text-xs">Leading Bidder</p>
                        <p className="text-white font-semibold">{item.bidderName}</p>
                        <p className="text-gray-500 text-xs font-mono">
                          {item.highestBidder?.slice(0, 10)}...{item.highestBidder?.slice(-6)}
                        </p>
                      </div>
                    )}

                    {item.active && !(item.isOptimistic || item.isPending) && (
                      <Button
                        onClick={() => handleEndAuction(item.itemId)}
                        variant="destructive"
                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        {isMockMode ? "End Auction (Demo)" : "End Auction"}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Items Found</h3>
              <p className="text-gray-500">Add your first auction item to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
