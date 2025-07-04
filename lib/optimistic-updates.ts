// Optimistic updates for better UX
import { ethers } from "ethers"

export interface OptimisticItem {
  itemId: number
  itemName: string
  itemDescription: string
  startingPrice: bigint
  highestBid: bigint
  highestBidder: string
  bidderName: string
  active: boolean
  endTime: number
  createdAt: number
  isOptimistic?: boolean
  isPending?: boolean
}

export interface OptimisticBid {
  itemId: number
  bidAmount: string
  bidderName: string
  bidderAddress: string
  timestamp: number
  isOptimistic: true
}

class OptimisticUpdateManager {
  private pendingItems = new Map<number, OptimisticItem>()
  private pendingBids = new Map<string, OptimisticBid>()

  // Add optimistic item
  addOptimisticItem(item: Omit<OptimisticItem, "itemId" | "isOptimistic" | "isPending">): OptimisticItem {
    const itemId = Date.now() // Temporary ID
    const optimisticItem: OptimisticItem = {
      ...item,
      itemId,
      isOptimistic: true,
      isPending: true,
    }

    this.pendingItems.set(itemId, optimisticItem)
    return optimisticItem
  }

  // Add optimistic bid
  addOptimisticBid(itemId: number, bidAmount: string, bidderName: string, bidderAddress: string): OptimisticBid {
    const bidKey = `${itemId}-${Date.now()}`
    const optimisticBid: OptimisticBid = {
      itemId,
      bidAmount,
      bidderName,
      bidderAddress,
      timestamp: Date.now(),
      isOptimistic: true,
    }

    this.pendingBids.set(bidKey, optimisticBid)
    return optimisticBid
  }

  // Apply optimistic bid to item
  applyOptimisticBid(items: OptimisticItem[], bid: OptimisticBid): OptimisticItem[] {
    return items.map((item) => {
      if (item.itemId === bid.itemId) {
        return {
          ...item,
          highestBid: ethers.parseEther(bid.bidAmount),
          highestBidder: bid.bidderAddress,
          bidderName: bid.bidderName,
          isOptimistic: true,
        }
      }
      return item
    })
  }

  // Confirm optimistic update
  confirmItem(tempId: number, realItem: OptimisticItem): void {
    this.pendingItems.delete(tempId)
  }

  confirmBid(bidKey: string): void {
    this.pendingBids.delete(bidKey)
  }

  // Revert optimistic update
  revertItem(tempId: number): void {
    this.pendingItems.delete(tempId)
  }

  revertBid(bidKey: string): void {
    this.pendingBids.delete(bidKey)
  }

  // Get pending items
  getPendingItems(): OptimisticItem[] {
    return Array.from(this.pendingItems.values())
  }

  // Get pending bids
  getPendingBids(): OptimisticBid[] {
    return Array.from(this.pendingBids.values())
  }

  // Clear all pending
  clearAll(): void {
    this.pendingItems.clear()
    this.pendingBids.clear()
  }
}

export const optimisticManager = new OptimisticUpdateManager()
