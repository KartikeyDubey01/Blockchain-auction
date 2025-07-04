"use client"

import { useEffect, useRef } from "react"

export default function BlockchainVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const blocks: Array<{
      x: number
      y: number
      size: number
      hash: string
      connections: number[]
      pulse: number
    }> = []

    // Generate blockchain blocks
    for (let i = 0; i < 8; i++) {
      blocks.push({
        x: (canvas.width / 9) * (i + 1),
        y: canvas.height / 2 + Math.sin(i * 0.5) * 50,
        size: 40,
        hash: `0x${Math.random().toString(16).substr(2, 8)}`,
        connections: i > 0 ? [i - 1] : [],
        pulse: Math.random() * Math.PI * 2,
      })
    }

    let animationFrame: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      ctx.strokeStyle = "rgba(0, 255, 238, 0.5)"
      ctx.lineWidth = 2
      blocks.forEach((block, i) => {
        block.connections.forEach((connIndex) => {
          const connBlock = blocks[connIndex]
          ctx.beginPath()
          ctx.moveTo(block.x, block.y)
          ctx.lineTo(connBlock.x, connBlock.y)
          ctx.stroke()
        })
      })

      // Draw blocks
      blocks.forEach((block, i) => {
        block.pulse += 0.05

        // Glowing effect
        const glowSize = block.size + Math.sin(block.pulse) * 5
        const gradient = ctx.createRadialGradient(block.x, block.y, 0, block.x, block.y, glowSize)
        gradient.addColorStop(0, "rgba(0, 255, 238, 0.8)")
        gradient.addColorStop(0.5, "rgba(255, 0, 122, 0.4)")
        gradient.addColorStop(1, "rgba(0, 255, 238, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(block.x, block.y, glowSize, 0, Math.PI * 2)
        ctx.fill()

        // Block core
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        ctx.beginPath()
        ctx.arc(block.x, block.y, block.size, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = "rgba(0, 255, 238, 1)"
        ctx.lineWidth = 2
        ctx.stroke()

        // Block number
        ctx.fillStyle = "#00ffee"
        ctx.font = "14px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`#${i + 1}`, block.x, block.y + 5)
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-slide-up">
      <div className="bg-gradient-to-r from-cyan-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl p-6 border border-cyan-500/20">
        <h3 className="text-2xl font-bold text-center text-white mb-4 cyber-text">Live Blockchain Network</h3>
        <canvas ref={canvasRef} className="w-full h-64 rounded-lg" style={{ background: "rgba(0, 0, 0, 0.3)" }} />
        <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            <span>Active Blocks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
            <span>Network Pulse</span>
          </div>
        </div>
      </div>
    </div>
  )
}
