const hre = require("hardhat")

async function main() {
  console.log("🔧 Setting up local development environment...")

  // Get all accounts
  const accounts = await hre.ethers.getSigners()
  console.log("📋 Available accounts:")

  for (let i = 0; i < Math.min(accounts.length, 5); i++) {
    const account = accounts[i]
    const balance = await hre.ethers.provider.getBalance(account.address)
    console.log(`${i}: ${account.address} (${hre.ethers.formatEther(balance)} ETH)`)
  }

  console.log("\n🔑 Private keys for MetaMask import:")
  const privateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account 0
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account 1
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account 2
  ]

  privateKeys.forEach((key, i) => {
    console.log(`Account ${i}: ${key}`)
  })

  console.log("\n📝 MetaMask Setup Instructions:")
  console.log("1. Open MetaMask")
  console.log("2. Click on network dropdown")
  console.log("3. Click 'Add Network' -> 'Add a network manually'")
  console.log("4. Enter the following details:")
  console.log("   - Network Name: Hardhat Local")
  console.log("   - New RPC URL: http://127.0.0.1:8545")
  console.log("   - Chain ID: 31337")
  console.log("   - Currency Symbol: ETH")
  console.log("5. Save and switch to this network")
  console.log("6. Import accounts using the private keys above")

  console.log("\n🚀 Ready for deployment!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
