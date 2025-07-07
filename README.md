# 🚀 Blockchain Auction - Local Deployment Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MetaMask** browser extension
3. **Git** (optional)

## Step 1: Install Dependencies

\`\`\`bash
npm install
\`\`\`

## Step 2: Start Hardhat Local Network

Open a terminal and run:

\`\`\`bash
npx hardhat node
\`\`\`

This will:
- Start a local Ethereum network on `http://127.0.0.1:8545`
- Create 20 test accounts with 10,000 ETH each
- Display account addresses and private keys

**Keep this terminal running!**

## Step 3: Setup MetaMask

1. Open MetaMask
2. Click network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" → "Add a network manually"
4. Enter these details:
   - **Network Name**: `Hardhat Local`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
5. Click "Save"
6. Switch to the new "Hardhat Local" network

## Step 4: Import Test Account

1. In MetaMask, click account icon → "Import Account"
2. Select "Private Key"
3. Paste this private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Click "Import"

This account will have 10,000 ETH for testing.

## Step 5: Deploy Smart Contract

Open a new terminal (keep the first one running) and run:

\`\`\`bash
npx hardhat run scripts/deploy.js --network localhost
\`\`\`

This will:
- Deploy the Auction contract
- Add 3 sample auction items
- Display the contract address
- Save deployment info

**Copy the contract address from the output!**

## Step 6: Update Frontend Configuration

1. Open `hooks/useWeb3.ts`
2. Find the line: `let CONTRACT_ADDRESS = "0x000000000000000000000000000000"`
3. Replace with your deployed contract address
4. Save the file

## Step 7: Start Frontend

\`\`\`bash
npm run dev
\`\`\`

Open `http://localhost:3000` in your browser.

## Step 8: Test the Application

1. **Connect Wallet**: Click "Connect Wallet" and select MetaMask
2. **View Auctions**: You should see 3 sample auction items
3. **Place Bids**: Try placing bids on items
4. **Admin Panel**: Visit `/admin` to add new items
5. **Scheduler**: Visit `/scheduler` to schedule automated bids

## Troubleshooting

### "Contract not found" Error
- Make sure Hardhat node is running
- Verify the contract address in `useWeb3.ts` matches deployment output
- Check MetaMask is on "Hardhat Local" network

### "Wrong Network" Error
- Switch MetaMask to "Hardhat Local" network
- Chain ID should be 31337

### "Insufficient Funds" Error
- Make sure you imported the test account with private key
- Account should have 10,000 ETH

### "Connection Failed" Error
- Restart Hardhat node: `npx hardhat node`
- Refresh the browser page
- Reconnect MetaMask

## Development Commands

\`\`\`bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Clean artifacts
npx hardhat clean

# Setup accounts info
npx hardhat run scripts/setup-local.js --network localhost
\`\`\`

## Production Deployment

For mainnet or testnet deployment:

1. Update `hardhat.config.js` with your network settings
2. Set up environment variables for private keys
3. Deploy with: `npx hardhat run scripts/deploy.js --network <network-name>`
4. Update frontend with production contract address

## Security Notes

⚠️ **NEVER use test private keys in production!**
⚠️ **Always use environment variables for production private keys**
⚠️ **Test thoroughly before mainnet deployment**
