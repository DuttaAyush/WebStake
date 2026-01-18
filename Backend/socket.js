const socketIo = require('socket.io');
const teamModel = require('./models/team.model');
const productModel = require('./models/product.model');

let io;
let currentAuction = null; // { productId, startTime, endTime, timerId, extensionThreshold, extensionAmount }

function initializeSocket(server) {
    console.log('Initializing Socket.io...');
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Send current auction info on connect
        if (currentAuction) {
            socket.emit('auction:active', {
                productId: currentAuction.productId,
                timeRemaining: getTimeRemaining(),
                endTime: currentAuction.endTime
            });
        }

        // Place Bid Event
        socket.on('place:bid', async (data) => {
            try {
                const { teamId, amount } = data;

                // Check if auction is active
                if (!currentAuction) {
                    return socket.emit('bid:error', { message: 'No active auction' });
                }

                // Find team and product
                const team = await teamModel.findById(teamId);
                const product = await productModel.findById(currentAuction.productId);

                // Validate team
                if (!team) {
                    return socket.emit('bid:error', { message: 'Team not found' });
                }

                // Validate product
                if (!product) {
                    return socket.emit('bid:error', { message: 'Product not found' });
                }

                // Check sufficient points
                if (team.points < amount) {
                    return socket.emit('bid:error', { message: 'Insufficient points' });
                }

                // Check bid is higher than current
                if (amount <= product.highestBid) {
                    return socket.emit('bid:error', { 
                        message: `Bid must be higher than ${product.highestBid} points` 
                    });
                }

                // Update product
                const oldBid = product.highestBid;
                product.highestBid = amount;
                product.winTeam = teamId;
                await product.save();

                // Deduct points from team
                team.points -= amount;
                await team.save();

                // Extend timer if needed
                const wasExtended = extendAuctionTimer();

                // Broadcast to ALL users
                io.emit('bid:update', {
                    productId: product._id,
                    productName: product.name,
                    newBid: amount,
                    oldBid: oldBid,
                    teamName: team.name,
                    teamId: team._id,
                    timerExtended: wasExtended,
                    timeRemaining: getTimeRemaining(),
                    timestamp: Date.now()
                });

                // Confirm to bidder
                socket.emit('bid:success', { 
                    message: 'Bid placed successfully',
                    newBalance: team.points
                });

            } catch (error) {
                console.error('Bid error:', error);
                socket.emit('bid:error', { message: error.message });
            }
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}

// Start Auction Timer (2-3 minutes)
function startAuctionTimer(productId, durationMs = 180000) { // 3 mins = 180000ms
    if (currentAuction) {
        console.log('Stopping previous auction...');
        stopAuctionTimer();
    }

    const startTime = Date.now();
    const endTime = startTime + durationMs;

    currentAuction = {
        productId,
        startTime,
        endTime,
        timerId: null,
        extensionThreshold: 15000, // 15 seconds
        extensionAmount: 10000      // Add 10 seconds
    };

    // Timer tick every second
    currentAuction.timerId = setInterval(() => {
        const timeLeft = getTimeRemaining();

        if (timeLeft <= 0) {
            endAuction();
        } else {
            // Broadcast timer update to all users
            io.emit('timer:update', {
                productId,
                timeRemaining: timeLeft,
                endTime: currentAuction.endTime
            });
        }
    }, 1000);

    // Notify all users auction started
    io.emit('auction:started', {
        productId,
        endTime,
        timeRemaining: durationMs
    });

    console.log(`Auction started for product: ${productId} (Duration: ${durationMs / 1000}s)`);
}

// Stop Auction Timer
function stopAuctionTimer() {
    if (currentAuction && currentAuction.timerId) {
        clearInterval(currentAuction.timerId);
        currentAuction = null;
        console.log('Auction timer stopped');
    }
}

// Get Time Remaining
function getTimeRemaining() {
    if (!currentAuction) return 0;
    return Math.max(0, currentAuction.endTime - Date.now());
}

// Extend Timer Logic (< 15 sec → +10 sec)
function extendAuctionTimer() {
    if (!currentAuction) return false;

    const timeLeft = getTimeRemaining();

    // If less than 15 seconds remaining, add 10 seconds
    if (timeLeft < currentAuction.extensionThreshold && timeLeft > 0) {
        currentAuction.endTime += currentAuction.extensionAmount;
        
        io.emit('timer:extended', {
            productId: currentAuction.productId,
            newEndTime: currentAuction.endTime,
            addedSeconds: currentAuction.extensionAmount / 1000,
            newTimeRemaining: getTimeRemaining()
        });

        console.log(`Timer extended by ${currentAuction.extensionAmount / 1000} seconds`);
        return true;
    }

    return false;
}

// End Auction
async function endAuction() {
    if (!currentAuction) return;

    const productId = currentAuction.productId;
    stopAuctionTimer();

    try {
        const product = await productModel.findById(productId).populate('winTeam');

        if (!product) {
            console.error('Product not found when ending auction');
            return;
        }

        // Broadcast auction ended
        io.emit('auction:ended', {
            productId,
            productName: product.name,
            winningBid: product.highestBid,
            winner: product.winTeam ? {
                teamId: product.winTeam._id,
                teamName: product.winTeam.name
            } : null,
            timestamp: Date.now()
        });

        console.log(`Auction ended for product: ${product.name}`);
        if (product.winTeam) {
            console.log(`Winner: ${product.winTeam.name} with bid: ${product.highestBid}`);
        } else {
            console.log('No winner (no bids placed)');
        }

    } catch (error) {
        console.error('Error ending auction:', error);
    }
}

// Send message to specific socket ID
const sendMessageToSocketId = (socketId, messageObject) => {
    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

// Get current auction status
function getCurrentAuction() {
    if (!currentAuction) return null;
    
    return {
        productId: currentAuction.productId,
        startTime: currentAuction.startTime,
        endTime: currentAuction.endTime,
        timeRemaining: getTimeRemaining(),
        isActive: true
    };
}

module.exports = { 
    initializeSocket, 
    sendMessageToSocketId,
    startAuctionTimer,
    stopAuctionTimer,
    endAuction,
    getCurrentAuction,
    extendAuctionTimer
};