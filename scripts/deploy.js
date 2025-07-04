const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

async function main() {
  console.log("🚀 Starting deployment...")

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners()
  console.log("📝 Deploying contracts with account:", deployer.address)
  console.log(
    "💰 Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH",
  )

  // Deploy the Auction contract
  console.log("🔨 Deploying Auction contract...")
  const Auction = await hre.ethers.getContractFactory("Auction")
  const auction = await Auction.deploy()

  await auction.waitForDeployment()
  const contractAddress = await auction.getAddress()

  console.log("✅ Auction contract deployed to:", contractAddress)
  console.log("👤 Contract owner:", await auction.owner())

  // Add some sample items for testing
  console.log("📦 Adding sample auction items...")

  const sampleItems = [
    {
      name: "Cyber Dragon NFT",
      description: "Legendary digital dragon with plasma breath",
      startingPrice: hre.ethers.parseEther("0.5"),
    },
    {
      name: "Neon City Artwork",
      description: "Futuristic cityscape with holographic elements",
      startingPrice: hre.ethers.parseEther("1.0"),
    },
    {
      name: "Digital Sword of Power",
      description: "Legendary weapon from the metaverse",
      startingPrice: hre.ethers.parseEther("0.8"),
    },
  ]

  for (let i = 0; i < sampleItems.length; i++) {
    const item = sampleItems[i]
    console.log(`Adding item ${i + 1}: ${item.name}`)

    const tx = await auction.addItem(item.name, item.description, item.startingPrice)
    await tx.wait()

    console.log(`✅ Item ${i + 1} added successfully`)
  }

  // Create deployment info for frontend
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    sampleItems: sampleItems.length,
    abi: [
      "function addItem(string memory _itemName, string memory _itemDescription, uint256 _startingPrice) public",
      "function addScheduledItem(string memory _itemName, string memory _itemDescription, uint256 _startingPrice, uint256 _duration) public",
      "function placeBid(uint256 _itemId, string memory _bidderName) public payable",
      "function endAuction(uint256 _itemId) public",
      "function checkAndEndAuction(uint256 _itemId) public",
      "function withdraw() public",
      "function getAllItems() public view returns (tuple(uint256 itemId, string itemName, string itemDescription, uint256 startingPrice, uint256 highestBid, address highestBidder, string bidderName, bool active, uint256 endTime, uint256 createdAt)[])",
      "function getActiveItems() public view returns (tuple(uint256 itemId, string itemName, string itemDescription, uint256 startingPrice, uint256 highestBid, address highestBidder, string bidderName, bool active, uint256 endTime, uint256 createdAt)[])",
      "function getItem(uint256 _itemId) public view returns (tuple(uint256 itemId, string itemName, string itemDescription, uint256 startingPrice, uint256 highestBid, address highestBidder, string bidderName, bool active, uint256 endTime, uint256 createdAt))",
      "function getPendingReturn(address _bidder) public view returns (uint256)",
      "function getContractBalance() public view returns (uint256)",
      "function owner() public view returns (address)",
      "function itemCount() public view returns (uint256)",
      "function emergencyPause() public",
      "event ItemAdded(uint256 itemId, string itemName, uint256 startingPrice, uint256 endTime)",
      "event BidPlaced(uint256 itemId, address bidder, string bidderName, uint256 bidAmount)",
      "event AuctionEnded(uint256 itemId, address winner, uint256 winningBid)",
      "event WithdrawalMade(address bidder, uint256 amount)",
    ],
  }

  // Save deployment info to multiple locations for frontend access
  const deploymentPaths = [
    path.join(__dirname, "../deployment-info.json"),
    path.join(__dirname, "../public/deployment-info.json"),
    path.join(__dirname, "../contracts/deployment-info.json"),
  ]

  deploymentPaths.forEach((deploymentPath) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(deploymentPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2))
      console.log("📄 Deployment info saved to:", deploymentPath)
    } catch (err) {
      console.warn("⚠️  Could not save to:", deploymentPath, err.message)
    }
  })

  // Also save to a simple format for easy import
  const contractConfig = `// Auto-generated contract configuration
export const CONTRACT_CONFIG = {
  address: "${contractAddress}",
  deployerAddress: "${deployer.address}",
  network: "${hre.network.name}",
  chainId: ${hre.network.config.chainId || 31337},
  deploymentTime: "${new Date().toISOString()}",
  blockNumber: ${await hre.ethers.provider.getBlockNumber()}
};

export const CONTRACT_ADDRESS = "${contractAddress}";
export const DEPLOYER_ADDRESS = "${deployer.address}";
export const NETWORK_CHAIN_ID = ${hre.network.config.chainId || 31337};
`

  const configPath = path.join(__dirname, "../lib/contract-config.ts")
  try {
    fs.writeFileSync(configPath, contractConfig)
    console.log("📄 Contract config saved to:", configPath)
  } catch (err) {
    console.warn("⚠️  Could not save contract config:", err.message)
  }

  console.log("\n🎉 Deployment completed successfully!")
  console.log("\n📋 Summary:")
  console.log("Contract Address:", contractAddress)
  console.log("Deployer Address:", deployer.address)
  console.log("Network:", hre.network.name)
  console.log("Chain ID:", hre.network.config.chainId || 31337)
  console.log("Sample Items Added:", sampleItems.length)

  console.log("\n🔧 Frontend will automatically detect this deployment!")
  console.log("✅ No manual configuration needed")
  console.log("✅ Contract address will be auto-loaded")
  console.log("✅ Just refresh your frontend after deployment")

  console.log("\n🔑 Deployer Private Key (for MetaMask import):")
  console.log("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
  console.log("⚠️  This is a test key - NEVER use in production!")

  // Start a simple HTTP server to serve deployment info if needed
  console.log("\n🌐 Deployment info available at:")
  console.log("- File: deployment-info.json")
  console.log("- Public: /public/deployment-info.json")
  console.log("- Config: /lib/contract-config.ts")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
