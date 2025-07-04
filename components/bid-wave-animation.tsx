"use client"

import { motion } from "framer-motion"

export default function BidWaveAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Wave Rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border-2 border-cyan-400 rounded-lg"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Energy Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
          style={{
            left: "50%",
            top: "50%",
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * Math.PI) / 4) * 100,
            y: Math.sin((i * Math.PI) / 4) * 100,
          }}
          transition={{
            duration: 1,
            delay: 0.5,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Success Text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-r from-cyan-500 to-pink-500 text-black px-4 py-2 rounded-full font-bold text-sm">
          BID PLACED! 🚀
        </div>
      </motion.div>
    </div>
  )
}
