// Deployment detection utilities
export interface DeploymentInfo {
  contractAddress: string
  deployerAddress: string
  network: string
  chainId: number
  deploymentTime: string
  blockNumber: number
  sampleItems: number
  abi: string[]
}

// Try to load deployment info from multiple sources
export async function detectDeployment(): Promise<DeploymentInfo | null> {
  const sources = [
    // Try to load from public folder (accessible via HTTP)
    "/deployment-info.json",
    // Try to load from contract config (if available)
    () =>
      import("./contract-config")
        .then((config) => ({
          contractAddress: config.CONTRACT_ADDRESS,
          deployerAddress: config.DEPLOYER_ADDRESS,
          network: "localhost",
          chainId: config.NETWORK_CHAIN_ID,
          deploymentTime: "",
          blockNumber: 0,
          sampleItems: 0,
          abi: [],
        }))
        .catch(() => null),
  ]

  for (const source of sources) {
    try {
      let deploymentInfo: DeploymentInfo | null = null

      if (typeof source === "string") {
        // Try to fetch from URL
        const response = await fetch(source)
        if (response.ok) {
          deploymentInfo = await response.json()
        }
      } else if (typeof source === "function") {
        // Try to execute function
        deploymentInfo = await source()
      }

      if (deploymentInfo && deploymentInfo.contractAddress && deploymentInfo.contractAddress !== "") {
        console.log("✅ Found deployment info from source:", typeof source === "string" ? source : "config")
        return deploymentInfo
      }
    } catch (err) {
      console.log("⚠️  Could not load from source:", typeof source === "string" ? source : "config", err)
    }
  }

  console.log("❌ No deployment info found")
  return null
}

// Check if deployment is recent (within last 24 hours)
export function isRecentDeployment(deploymentTime: string): boolean {
  if (!deploymentTime) return false

  const deployTime = new Date(deploymentTime).getTime()
  const now = Date.now()
  const hoursDiff = (now - deployTime) / (1000 * 60 * 60)

  return hoursDiff < 24
}

// Validate deployment info
export function validateDeployment(info: DeploymentInfo): boolean {
  return !!(
    (
      info.contractAddress &&
      info.contractAddress !== "" &&
      info.contractAddress.startsWith("0x") &&
      info.contractAddress.length === 42 &&
      info.chainId === 31337
    ) // Hardhat local network
  )
}
