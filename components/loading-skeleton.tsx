"use client"

import { Card } from "@/components/ui/card"

export function AuctionCardSkeleton() {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-gray-700/20 animate-pulse">
      <div className="p-6 space-y-4">
        {/* Image placeholder */}
        <div className="h-48 bg-gray-700/30 rounded-lg"></div>

        {/* Header */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-700/30 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700/20 rounded w-full"></div>
        </div>

        {/* Price display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/20 rounded-lg p-3">
            <div className="h-3 bg-gray-600/30 rounded w-20 mb-2"></div>
            <div className="h-5 bg-gray-600/30 rounded w-16"></div>
          </div>
          <div className="bg-gray-700/20 rounded-lg p-3">
            <div className="h-3 bg-gray-600/30 rounded w-20 mb-2"></div>
            <div className="h-5 bg-gray-600/30 rounded w-16"></div>
          </div>
        </div>

        {/* Button */}
        <div className="h-12 bg-gray-700/30 rounded-lg"></div>
      </div>
    </Card>
  )
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className={`${sizeClasses[size]} border-2 border-cyan-500 border-t-transparent rounded-full animate-spin`} />
  )
}

export function ItemListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <AuctionCardSkeleton key={i} />
      ))}
    </div>
  )
}
