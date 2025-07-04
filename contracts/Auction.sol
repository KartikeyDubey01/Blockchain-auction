// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Auction {
    struct Item {
        uint256 itemId;
        string itemName;
        string itemDescription;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        string bidderName;
        bool active;
        uint256 endTime; // Added for scheduled auctions
        uint256 createdAt; // Added for tracking
    }
    
    mapping(uint256 => Item) public items;
    mapping(address => uint256) public pendingReturns; // For safer withdrawals
    uint256 public itemCount;
    address public owner;
    
    // Events
    event ItemAdded(uint256 itemId, string itemName, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 itemId, address bidder, string bidderName, uint256 bidAmount);
    event AuctionEnded(uint256 itemId, address winner, uint256 winningBid);
    event WithdrawalMade(address bidder, uint256 amount);
    
    constructor() {
        owner = msg.sender;
        itemCount = 0;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    
    modifier validItem(uint256 _itemId) {
        require(_itemId > 0 && _itemId <= itemCount, "Invalid item ID");
        require(items[_itemId].itemId != 0, "Item does not exist");
        _;
    }
    
    function addItem(
        string memory _itemName,
        string memory _itemDescription,
        uint256 _startingPrice
    ) public onlyOwner {
        require(bytes(_itemName).length > 0, "Item name cannot be empty");
        require(_startingPrice > 0, "Starting price must be greater than 0");
        
        itemCount++;
        items[itemCount] = Item({
            itemId: itemCount,
            itemName: _itemName,
            itemDescription: _itemDescription,
            startingPrice: _startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            bidderName: "",
            active: true,
            endTime: 0, // 0 means no scheduled end time
            createdAt: block.timestamp
        });
        
        emit ItemAdded(itemCount, _itemName, _startingPrice, 0);
    }
    
    // New function for scheduled auctions
    function addScheduledItem(
        string memory _itemName,
        string memory _itemDescription,
        uint256 _startingPrice,
        uint256 _duration // Duration in seconds
    ) public onlyOwner {
        require(bytes(_itemName).length > 0, "Item name cannot be empty");
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        itemCount++;
        uint256 endTime = block.timestamp + _duration;
        
        items[itemCount] = Item({
            itemId: itemCount,
            itemName: _itemName,
            itemDescription: _itemDescription,
            startingPrice: _startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            bidderName: "",
            active: true,
            endTime: endTime,
            createdAt: block.timestamp
        });
        
        emit ItemAdded(itemCount, _itemName, _startingPrice, endTime);
    }
    
    function placeBid(uint256 _itemId, string memory _bidderName) 
        public 
        payable 
        validItem(_itemId) 
    {
        Item storage item = items[_itemId];
        
        require(item.active, "Auction for this item is not active");
        require(bytes(_bidderName).length > 0, "Bidder name cannot be empty");
        
        // Check if auction has ended (for scheduled auctions)
        if (item.endTime > 0 && block.timestamp >= item.endTime) {
            item.active = false;
            revert("Auction has ended");
        }
        
        require(msg.value > item.highestBid, "Bid amount must be higher than current highest bid");
        require(msg.value >= item.startingPrice, "Bid amount must be at least the starting price");
        require(msg.sender != item.highestBidder, "You are already the highest bidder");
        
        // Add previous highest bidder to pending returns for safer withdrawal
        if (item.highestBidder != address(0)) {
            pendingReturns[item.highestBidder] += item.highestBid;
        }
        
        // Update item with new highest bid
        item.highestBid = msg.value;
        item.highestBidder = msg.sender;
        item.bidderName = _bidderName;
        
        emit BidPlaced(_itemId, msg.sender, _bidderName, msg.value);
    }
    
    // Safer withdrawal pattern
    function withdraw() public {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingReturns[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit WithdrawalMade(msg.sender, amount);
    }
    
    function endAuction(uint256 _itemId) public onlyOwner validItem(_itemId) {
        Item storage item = items[_itemId];
        require(item.active, "Auction already ended");
        
        item.active = false;
        
        // Transfer winning bid to owner
        if (item.highestBidder != address(0)) {
            (bool success, ) = payable(owner).call{value: item.highestBid}("");
            require(success, "Transfer to owner failed");
            
            emit AuctionEnded(_itemId, item.highestBidder, item.highestBid);
        }
    }
    
    // Auto-end auction if time has passed (can be called by anyone)
    function checkAndEndAuction(uint256 _itemId) public validItem(_itemId) {
        Item storage item = items[_itemId];
        require(item.active, "Auction already ended");
        require(item.endTime > 0, "Auction has no end time");
        require(block.timestamp >= item.endTime, "Auction has not ended yet");
        
        item.active = false;
        
        // Transfer winning bid to owner
        if (item.highestBidder != address(0)) {
            (bool success, ) = payable(owner).call{value: item.highestBid}("");
            require(success, "Transfer to owner failed");
            
            emit AuctionEnded(_itemId, item.highestBidder, item.highestBid);
        }
    }
    
    function getAllItems() public view returns (Item[] memory) {
        Item[] memory allItems = new Item[](itemCount);
        
        for (uint256 i = 1; i <= itemCount; i++) {
            allItems[i-1] = items[i];
        }
        
        return allItems;
    }
    
    function getActiveItems() public view returns (Item[] memory) {
        uint256 activeCount = 0;
        
        // Count active items
        for (uint256 i = 1; i <= itemCount; i++) {
            if (items[i].active && (items[i].endTime == 0 || block.timestamp < items[i].endTime)) {
                activeCount++;
            }
        }
        
        Item[] memory activeItems = new Item[](activeCount);
        uint256 currentIndex = 0;
        
        // Fill active items array
        for (uint256 i = 1; i <= itemCount; i++) {
            if (items[i].active && (items[i].endTime == 0 || block.timestamp < items[i].endTime)) {
                activeItems[currentIndex] = items[i];
                currentIndex++;
            }
        }
        
        return activeItems;
    }
    
    function getItem(uint256 _itemId) public view validItem(_itemId) returns (Item memory) {
        return items[_itemId];
    }
    
    function getPendingReturn(address _bidder) public view returns (uint256) {
        return pendingReturns[_bidder];
    }
    
    // Emergency function to pause all auctions
    function emergencyPause() public onlyOwner {
        for (uint256 i = 1; i <= itemCount; i++) {
            if (items[i].active) {
                items[i].active = false;
            }
        }
    }
    
    // Get contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
