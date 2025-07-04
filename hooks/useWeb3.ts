"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ethers } from "ethers"
import {
  detectDeployment,
  validateDeployment,
  isRecentDeployment,
  type DeploymentInfo,
} from "@/lib/deployment-detector"
import { cacheManager, CACHE_KEYS } from "@/lib/cache-manager"
import { optimisticManager, type OptimisticItem } from "@/lib/optimistic-updates"

// Contract ABI - Will be loaded from deployment info
const DEFAULT_CONTRACT_ABI = [
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
]

// Mock data for development (fallback)
const MOCK_ITEMS = [
  {
    itemId: 1,
    itemName: "Cyber Dragon NFT",
    itemDescription: "Legendary digital dragon with plasma breath",
    startingPrice: ethers.parseEther("0.5"),
    highestBid: ethers.parseEther("2.3"),
    highestBidder: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",
    bidderName: "CryptoWarrior",
    active: true,
    endTime: 0,
    createdAt: Date.now(),
  },
  {
    itemId: 2,
    itemName: "Neon City Artwork",
    itemDescription: "Futuristic cityscape with holographic elements",
    startingPrice: ethers.parseEther("1.0"),
    highestBid: ethers.parseEther("1.8"),
    highestBidder: "0x8ba1f109551bD432803012645Hac136c30C6C87",
    bidderName: "BlockMaster",
    active: true,
    endTime: 0,
    createdAt: Date.now(),
  },
  {
    itemId: 3,
    itemName: "Digital Sword of Power",
    itemDescription: "Legendary weapon from the metaverse",
    startingPrice: ethers.parseEther("0.8"),
    highestBid: ethers.parseEther("3.2"),
    highestBidder: "0x123d35Cc6634C0532925a3b8D4C9db96590c1234",
    bidderName: "NFTHunter",
    active: false,
    endTime: 0,
    createdAt: Date.now(),
  },
]

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null)
  const [contractAddress, setContractAddress] = useState<string>("")

  // Background sync refs
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncRef = useRef<number>(0)

  // Auto-detect deployment on component mount
  useEffect(() => {
    const loadDeploymentInfo = async () => {
      try {
        console.log("🔍 Detecting contract deployment...")
        const deployment = await detectDeployment()

        if (deployment && validateDeployment(deployment)) {
          console.log("✅ Valid deployment detected:", deployment.contractAddress)
          setDeploymentInfo(deployment)
          setContractAddress(deployment.contractAddress)

          // Check if deployment is recent
          if (isRecentDeployment(deployment.deploymentTime)) {
            console.log("🆕 Recent deployment detected!")
          }

          // Save to localStorage for future use
          localStorage.setItem("LAST_DEPLOYMENT", JSON.stringify(deployment))
        } else {
          console.log("❌ No valid deployment found, checking localStorage...")

          // Try to load from localStorage
          const saved = localStorage.getItem("LAST_DEPLOYMENT")
          if (saved) {
            try {
              const savedDeployment = JSON.parse(saved)
              if (validateDeployment(savedDeployment)) {
                console.log("📦 Using saved deployment:", savedDeployment.contractAddress)
                setDeploymentInfo(savedDeployment)
                setContractAddress(savedDeployment.contractAddress)
              }
            } catch (err) {
              console.warn("⚠️  Invalid saved deployment data")
              localStorage.removeItem("LAST_DEPLOYMENT")
            }
          }
        }
      } catch (err) {
        console.error("❌ Failed to detect deployment:", err)
      }
    }

    loadDeploymentInfo()
  }, [])

  // Background sync for real-time updates
  const startBackgroundSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }

    syncIntervalRef.current = setInterval(async () => {
      if (!contract || !isConnected || isMockMode) return

      try {
        // Only sync if last sync was more than 15 seconds ago
        const now = Date.now()
        if (now - lastSyncRef.current < 15000) return

        console.log("🔄 Background sync...")
        const items = await contract.getAllItems()
        cacheManager.set(CACHE_KEYS.ALL_ITEMS, items, 60000) // Cache for 1 minute
        lastSyncRef.current = now
      } catch (err) {
        console.warn("Background sync failed:", err)
      }
    }, 20000) // Sync every 20 seconds
  }, [contract, isConnected, isMockMode])

  // Stop background sync
  const stopBackgroundSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
  }, [])

  // Check if we're on the correct network
  const checkNetwork = async (provider: ethers.BrowserProvider) => {
    try {
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      setNetworkInfo({
        name: network.name,
        chainId: chainId,
        isLocalhost: chainId === 31337,
      })

      // If not on localhost, prompt user to switch
      if (chainId !== 31337) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x7a69" }], // 31337 in hex
          })
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x7a69",
                  chainName: "Hardhat Local",
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["http://127.0.0.1:8545"],
                  blockExplorerUrls: null,
                },
              ],
            })
          }
        }
      }

      return chainId === 31337
    } catch (err) {
      console.error("Network check failed:", err)
      return false
    }
  }

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }

    if (loading) {
      console.log("Connection already in progress...")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      const userAccount = accounts[0]
      console.log("Connected account:", userAccount)

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()

      // Check network
      const isCorrectNetwork = await checkNetwork(web3Provider)
      if (!isCorrectNetwork) {
        throw new Error("Please switch to Hardhat Local Network (Chain ID: 31337)")
      }

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(userAccount)
      setIsConnected(true)

      // Try to connect to contract using detected deployment
      if (contractAddress && contractAddress !== "") {
        try {
          console.log("🔗 Connecting to detected contract:", contractAddress)

          // Use ABI from deployment info or default
          const contractABI = deploymentInfo?.abi || DEFAULT_CONTRACT_ABI

          // Create contract instance
          const auctionContract = new ethers.Contract(contractAddress, contractABI, web3Signer)

          // Test contract connection
          const code = await web3Provider.getCode(contractAddress)
          if (code === "0x") {
            throw new Error("No contract deployed at this address")
          }

          // Test contract by calling a view function
          const itemCount = await auctionContract.itemCount()
          console.log("✅ Contract connected! Item count:", itemCount.toString())

          // Check if user is owner (cache result)
          try {
            let owner = cacheManager.get<string>(CACHE_KEYS.CONTRACT_OWNER)
            if (!owner) {
              owner = await auctionContract.owner()
              cacheManager.set(CACHE_KEYS.CONTRACT_OWNER, owner, 300000) // Cache for 5 minutes
            }

            const isUserOwner = owner.toLowerCase() === userAccount.toLowerCase()
            setIsOwner(isUserOwner)
            console.log("👤 Contract owner:", owner)
            console.log("🔑 User is owner:", isUserOwner)
          } catch (ownerErr) {
            console.warn("⚠️  Could not check contract owner:", ownerErr)
            setIsOwner(false)
          }

          setContract(auctionContract)
          setIsMockMode(false)
          setError(null)

          // Start background sync
          startBackgroundSync()

          console.log("🎉 Successfully connected to auto-detected contract!")
        } catch (contractErr: any) {
          console.error("❌ Contract connection failed:", contractErr)
          setError(`Contract connection failed: ${contractErr.message}. Using demo mode.`)
          setIsMockMode(true)
          setIsOwner(true)
        }
      } else {
        console.log("⚠️  No contract deployment detected, using mock mode")
        setError("No contract deployment found. Deploy your contract first or use demo mode.")
        setIsMockMode(true)
        setIsOwner(true)
      }
    } catch (err: any) {
      console.error("❌ Failed to connect wallet:", err)

      if (err.code === 4001) {
        setError("Connection rejected by user")
      } else if (err.code === -32002) {
        setError("Connection request already pending. Please check MetaMask.")
      } else {
        setError(err.message || "Failed to connect wallet")
      }
    } finally {
      setLoading(false)
    }
  }, [loading, contractAddress, deploymentInfo, startBackgroundSync])

  // Function to refresh deployment detection
  const refreshDeployment = useCallback(async () => {
    console.log("🔄 Refreshing deployment detection...")
    const deployment = await detectDeployment()

    if (deployment && validateDeployment(deployment)) {
      console.log("✅ New deployment detected:", deployment.contractAddress)
      setDeploymentInfo(deployment)
      setContractAddress(deployment.contractAddress)
      localStorage.setItem("LAST_DEPLOYMENT", JSON.stringify(deployment))

      // Clear cache
      cacheManager.clear()

      // Reconnect if already connected
      if (isConnected) {
        connectWallet()
      }

      return true
    }

    return false
  }, [isConnected, connectWallet])

  const addItem = useCallback(
    async (name: string, description: string, startingPrice: string) => {
      if (isMockMode) {
        console.log("Mock: Adding item", { name, description, startingPrice })

        // Create optimistic item for immediate UI update
        const optimisticItem = optimisticManager.addOptimisticItem({
          itemName: name,
          itemDescription: description,
          startingPrice: ethers.parseEther(startingPrice),
          highestBid: BigInt(0),
          highestBidder: "",
          bidderName: "",
          active: true,
          endTime: 0,
          createdAt: Date.now(),
        })

        // Invalidate cache to force refresh
        cacheManager.invalidate(CACHE_KEYS.ALL_ITEMS)

        await new Promise((resolve) => setTimeout(resolve, 2000))
        return optimisticItem
      }

      if (!contract || !signer) throw new Error("Contract not initialized")

      try {
        setLoading(true)

        // Create optimistic item for immediate UI update
        const optimisticItem = optimisticManager.addOptimisticItem({
          itemName: name,
          itemDescription: description,
          startingPrice: ethers.parseEther(startingPrice),
          highestBid: BigInt(0),
          highestBidder: "",
          bidderName: "",
          active: true,
          endTime: 0,
          createdAt: Date.now(),
        })

        const priceInWei = ethers.parseEther(startingPrice)
        console.log("Adding item:", { name, description, priceInWei: priceInWei.toString() })

        const tx = await contract.addItem(name, description, priceInWei)
        console.log("Transaction sent:", tx.hash)

        // Don't wait for confirmation - return optimistic result
        // Background process will handle confirmation
        tx.wait()
          .then((receipt) => {
            console.log("Transaction confirmed:", receipt.hash)
            optimisticManager.confirmItem(optimisticItem.itemId, optimisticItem)
            // Invalidate cache to force refresh
            cacheManager.invalidatePattern("auction:items")
          })
          .catch((err) => {
            console.error("Transaction failed:", err)
            optimisticManager.revertItem(optimisticItem.itemId)
          })

        return optimisticItem
      } catch (err: any) {
        console.error("Failed to add item:", err)
        throw new Error(err.message || "Failed to add item")
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, isMockMode],
  )

  const placeBid = useCallback(
    async (itemId: number, bidderName: string, bidAmount: string) => {
      if (isMockMode) {
        console.log("Mock: Placing bid", { itemId, bidderName, bidAmount })
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
      }

      if (!contract || !signer || !account) throw new Error("Contract not initialized")

      try {
        setLoading(true)

        // Create optimistic bid for immediate UI update
        const optimisticBid = optimisticManager.addOptimisticBid(itemId, bidAmount, bidderName, account)

        const bidInWei = ethers.parseEther(bidAmount)
        console.log("Placing bid:", { itemId, bidderName, bidInWei: bidInWei.toString() })

        const tx = await contract.placeBid(itemId, bidderName, { value: bidInWei })
        console.log("Bid transaction sent:", tx.hash)

        // Don't wait for confirmation - return optimistic result
        tx.wait()
          .then((receipt) => {
            console.log("Bid transaction confirmed:", receipt.hash)
            optimisticManager.confirmBid(`${itemId}-${optimisticBid.timestamp}`)
            // Invalidate cache to force refresh
            cacheManager.invalidatePattern("auction:items")
          })
          .catch((err) => {
            console.error("Bid transaction failed:", err)
            optimisticManager.revertBid(`${itemId}-${optimisticBid.timestamp}`)
          })

        return optimisticBid
      } catch (err: any) {
        console.error("Failed to place bid:", err)
        throw new Error(err.message || "Failed to place bid")
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, isMockMode, account],
  )

  const endAuction = useCallback(
    async (itemId: number) => {
      if (isMockMode) {
        console.log("Mock: Ending auction", { itemId })
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
      }

      if (!contract || !signer) throw new Error("Contract not initialized")

      try {
        setLoading(true)
        const tx = await contract.endAuction(itemId)
        console.log("End auction transaction sent:", tx.hash)

        const receipt = await tx.wait()
        console.log("End auction transaction confirmed:", receipt.hash)

        // Invalidate cache
        cacheManager.invalidatePattern("auction:items")

        return receipt
      } catch (err: any) {
        console.error("Failed to end auction:", err)
        throw new Error(err.message || "Failed to end auction")
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, isMockMode],
  )

  const getAllItems = useCallback(async () => {
    if (isMockMode) {
      console.log("Mock: Getting all items")
      // Add optimistic items to mock data
      const pendingItems = optimisticManager.getPendingItems()
      return [...MOCK_ITEMS, ...pendingItems]
    }

    // Check cache first
    const cachedItems = cacheManager.get<OptimisticItem[]>(CACHE_KEYS.ALL_ITEMS)
    if (cachedItems) {
      console.log("📦 Using cached items")
      // Add optimistic items to cached data
      const pendingItems = optimisticManager.getPendingItems()
      const pendingBids = optimisticManager.getPendingBids()

      let items = [...cachedItems, ...pendingItems]

      // Apply optimistic bids
      pendingBids.forEach((bid) => {
        items = optimisticManager.applyOptimisticBid(items, bid)
      })

      return items
    }

    // Check if contract is initialized
    if (!contract) {
      console.warn("Contract not initialized, returning empty array")
      return []
    }

    // Check if we're connected
    if (!isConnected) {
      console.warn("Wallet not connected, returning empty array")
      return []
    }

    try {
      console.log("🔄 Fetching items from blockchain...")
      const items = await contract.getAllItems()
      console.log("✅ Fetched items:", items.length)

      // Cache the result
      cacheManager.set(CACHE_KEYS.ALL_ITEMS, items, 45000) // Cache for 45 seconds

      // Add optimistic items and bids
      const pendingItems = optimisticManager.getPendingItems()
      const pendingBids = optimisticManager.getPendingBids()

      let allItems = [...items, ...pendingItems]

      // Apply optimistic bids
      pendingBids.forEach((bid) => {
        allItems = optimisticManager.applyOptimisticBid(allItems, bid)
      })

      return allItems
    } catch (err: any) {
      console.error("Failed to get items:", err)
      // Return cached data if available, otherwise empty array
      return cachedItems || []
    }
  }, [contract, isMockMode, isConnected])

  const getItem = useCallback(
    async (itemId: number) => {
      if (isMockMode) {
        const item = MOCK_ITEMS.find((item) => item.itemId === itemId)
        if (!item) throw new Error("Item not found")
        return item
      }

      // Check cache first
      const cachedItem = cacheManager.get<OptimisticItem>(CACHE_KEYS.ITEM(itemId))
      if (cachedItem) {
        return cachedItem
      }

      if (!contract) {
        console.warn("Contract not initialized")
        return null
      }

      if (!isConnected) {
        console.warn("Wallet not connected")
        return null
      }

      try {
        const item = await contract.getItem(itemId)
        // Cache the result
        cacheManager.set(CACHE_KEYS.ITEM(itemId), item, 30000) // Cache for 30 seconds
        return item
      } catch (err: any) {
        console.error("Failed to get item:", err)
        return null
      }
    },
    [contract, isMockMode, isConnected],
  )

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined" && !isConnected && !loading) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            console.log("Auto-connecting to existing account...")
            connectWallet()
          }
        } catch (err) {
          console.error("Auto-connect failed:", err)
        }
      }
    }

    // Only auto-connect if we have a contract address
    if (contractAddress) {
      const timer = setTimeout(autoConnect, 1000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, loading, contractAddress])

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Accounts changed:", accounts)
        if (accounts.length === 0) {
          setIsConnected(false)
          setAccount(null)
          setContract(null)
          setSigner(null)
          setProvider(null)
          setIsOwner(false)
          setIsMockMode(false)
          stopBackgroundSync()
        } else if (accounts[0] !== account) {
          connectWallet()
        }
      }

      const handleChainChanged = (chainId: string) => {
        console.log("Chain changed:", chainId)
        window.location.reload()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [account, connectWallet, stopBackgroundSync])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackgroundSync()
    }
  }, [stopBackgroundSync])

  return {
    provider,
    signer,
    contract,
    account,
    isConnected,
    loading,
    error,
    isOwner,
    isMockMode,
    networkInfo,
    deploymentInfo,
    contractAddress,
    isContractReady: !!(contract || isMockMode),
    connectWallet,
    refreshDeployment,
    addItem,
    placeBid,
    endAuction,
    getAllItems,
    getItem,
    // Cache management
    clearCache: () => cacheManager.clear(),
    getCacheStats: () => cacheManager.getStats(),
  }
}
