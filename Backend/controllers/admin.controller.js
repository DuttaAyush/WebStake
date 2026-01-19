const productModel = require('../models/product.model');
const teamModel = require('../models/team.model');
const { startAuctionTimer, endAuction, getCurrentAuction } = require('../socket');

// Award Points to Team
module.exports.awardPoints = async (req, res) => {
    try {
        const { teamId, points, reason } = req.body;

        if (!teamId || !points) {
            return res.status(400).json({ message: 'Team ID and points are required' });
        }

        if (points <= 0) {
            return res.status(400).json({ message: 'Points must be positive' });
        }

        const team = await teamModel.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Add points
        team.points += points;
        await team.save();

        res.status(200).json({
            success: true,
            message: `${points} points awarded to ${team.name}`,
            team: {
                id: team._id,
                name: team.name,
                newBalance: team.points
            },
            reason: reason || 'Admin award'
        });

    } catch (error) {
        console.error('Error awarding points:', error);
        res.status(500).json({ message: error.message });
    }
};

// Deduct Points from Team
module.exports.deductPoints = async (req, res) => {
    try {
        const { teamId, points, reason } = req.body;

        if (!teamId || !points) {
            return res.status(400).json({ message: 'Team ID and points are required' });
        }

        if (points <= 0) {
            return res.status(400).json({ message: 'Points must be positive' });
        }

        const team = await teamModel.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (team.points < points) {
            return res.status(400).json({ message: 'Insufficient points' });
        }

        // Deduct points
        team.points -= points;
        await team.save();

        res.status(200).json({
            success: true,
            message: `${points} points deducted from ${team.name}`,
            team: {
                id: team._id,
                name: team.name,
                newBalance: team.points
            },
            reason: reason || 'Admin deduction'
        });

    } catch (error) {
        console.error('Error deducting points:', error);
        res.status(500).json({ message: error.message });
    }
};

// Start Auction for a Product
module.exports.startAuction = async (req, res) => {
    try {
        const { productId } = req.params;
        const { duration } = req.body; // Optional: custom duration in seconds

        // Check if auction already running
        const activeAuction = getCurrentAuction();
        if (activeAuction) {
            return res.status(400).json({ 
                message: 'Another auction is already running',
                activeProductId: activeAuction.productId
            });
        }

        // Find product
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if product already has winner
        if (product.winTeam) {
            return res.status(400).json({ 
                message: 'This product has already been auctioned',
                winner: product.winTeam
            });
        }

        // Start auction (default 3 minutes = 180000ms)
        const durationMs = duration ? duration * 1000 : 180000;
        startAuctionTimer(productId, durationMs);

        res.status(200).json({
            success: true,
            message: `Auction started for ${product.name}`,
            auction: {
                productId: product._id,
                productName: product.name,
                duration: durationMs / 1000,
                startingBid: product.startingPrice
            }
        });

    } catch (error) {
        console.error('Error starting auction:', error);
        res.status(500).json({ message: error.message });
    }
};

// End Auction Manually
module.exports.endAuctionManual = async (req, res) => {
    try {
        const activeAuction = getCurrentAuction();
        
        if (!activeAuction) {
            return res.status(400).json({ message: 'No active auction to end' });
        }

        // Get product details before ending
        const product = await productModel.findById(activeAuction.productId).populate('winTeam');

        // End the auction
        await endAuction();

        res.status(200).json({
            success: true,
            message: 'Auction ended manually',
            result: {
                productId: product._id,
                productName: product.name,
                winningBid: product.highestBid,
                winner: product.winTeam ? {
                    teamId: product.winTeam._id,
                    teamName: product.winTeam.name
                } : null
            }
        });

    } catch (error) {
        console.error('Error ending auction:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Current Auction Status
module.exports.getAuctionStatus = async (req, res) => {
    try {
        const activeAuction = getCurrentAuction();

        if (!activeAuction) {
            return res.status(200).json({
                isActive: false,
                message: 'No active auction'
            });
        }

        const product = await productModel.findById(activeAuction.productId).populate('winTeam');

        res.status(200).json({
            isActive: true,
            auction: {
                productId: product._id,
                productName: product.name,
                currentBid: product.highestBid,
                currentLeader: product.winTeam ? product.winTeam.name : null,
                timeRemaining: activeAuction.timeRemaining,
                endTime: activeAuction.endTime
            }
        });

    } catch (error) {
        console.error('Error getting auction status:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get All Teams with Points
module.exports.getAllTeams = async (req, res) => {
    try {
        const teams = await teamModel.find()
            .select('teamID name points members')
            .sort({ points: -1 }); // Sort by points descending

        res.status(200).json({
            success: true,
            count: teams.length,
            teams
        });

    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get All Products
module.exports.getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find()
            .populate('winTeam', 'name teamID')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Auction History
module.exports.getAuctionHistory = async (req, res) => {
    try {
        const completedAuctions = await productModel.find({ winTeam: { $ne: null } })
            .populate('winTeam', 'name teamID')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: completedAuctions.length,
            auctions: completedAuctions.map(product => ({
                productId: product._id,
                productName: product.name,
                winningBid: product.highestBid,
                winner: {
                    teamId: product.winTeam._id,
                    teamName: product.winTeam.name
                },
                completedAt: product.updatedAt
            }))
        });

    } catch (error) {
        console.error('Error fetching auction history:', error);
        res.status(500).json({ message: error.message });
    }
};