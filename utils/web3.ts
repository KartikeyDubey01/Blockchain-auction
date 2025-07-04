import { ethers } from "ethers"

export function formatEther(value: string | bigint): string {
  try {
    return ethers.formatEther(value)
  } catch (err) {
    return "0"
  }
}

export function parseEther(value: string): bigint {
  return ethers.parseEther(value)
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address)
    return true
  } catch {
    return false
  }
}
