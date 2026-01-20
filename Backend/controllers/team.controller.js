const teamModel = require('../models/team.model');
const productModel = require('../models/product.model');
const { getCurrentAuction } = require('../socket');

// Get Team Profile (with points balance)
module.exports.getProfile = async (req, res) => {
    try {
        const teamId = req.team._id; // From auth middleware

        const team = await teamModel.findById(teamId).select('-password');

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.status(200).json({
            success: true,
            team: {
                id: team._id,
                teamID: team.teamID,
                name: team.name,
                members: team.members,
                points: team.points
            }
        });

    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Team's Bid History
module.exports.getBidHistory = async (req, res) => {
    try {
        const teamId = req.team._id;

        const wonProducts = await productModel.find({ winTeam: teamId })
            .select('productID name description highestBid')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: wonProducts.length,
            wonItems: wonProducts.map(product => ({
                productId: product._id,
                productID: product.productID,
                name: product.name,
                description: product.description,
                winningBid: product.highestBid,
                wonAt: product.updatedAt
            }))
        });

    } catch (error) {
        console.error('Error getting bid history:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Current Live Auction
module.exports.getLiveAuction = async (req, res) => {
    try {
        const activeAuction = getCurrentAuction();

        if (!activeAuction) {
            return res.status(200).json({
                isActive: false,
                message: 'No active auction'
            });
        }

        const product = await productModel.findById(activeAuction.productId)
            .populate('winTeam', 'name teamID');

        res.status(200).json({
            success: true,
            isActive: true,
            auction: {
                productId: product._id,
                productID: product.productID,
                name: product.name,
                description: product.description,
                startingPrice: product.startingPrice,
                currentBid: product.highestBid,
                currentLeader: product.winTeam ? {
                    teamId: product.winTeam._id,
                    teamName: product.winTeam.name
                } : null,
                timeRemaining: activeAuction.timeRemaining,
                endTime: activeAuction.endTime
            }
        });

    } catch (error) {
        console.error('Error getting live auction:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Leaderboard (Top Teams by Points)
module.exports.getLeaderboard = async (req, res) => {
    try {
        const teams = await teamModel.find()
            .select('teamID name points')
            .sort({ points: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            leaderboard: teams.map((team, index) => ({
                rank: index + 1,
                teamId: team._id,
                teamID: team.teamID,
                name: team.name,
                points: team.points
            }))
        });

    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ message: error.message });
    }
};


module.exports.registerTeam = async (req, res) => {
    try {
        const { teamID, name, members, password } = req.body;
        // Validation
        if (!teamID || !name || !members || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check if team exists
        const existingTeam = await teamModel.findOne({
            $or: [{ teamID }, { name }]
        });

        if (existingTeam) {
            return res.status(401).json({
                message: 'Team with this ID or name already exists'
            });
        }

        // Hash password
        const hashPassword = await teamModel.hashPassword(password);

        // Create team - FIX: password not passwordh
        const team = await teamModel.create({
            teamID,
            name,
            members,
            password: hashPassword  // ✅ FIXED
        });

        // Generate token
        const token = team.generateAuthToken();

        res.status(201).json({
            success: true,
            team: {
                id: team._id,
                teamID: team.teamID,
                name: team.name,
                points: team.points
            },
            token
        });

    } catch (err) {
        console.error('Error registering team:', err);
        res.status(400).json({ message: err.message });
    }
}

module.exports.loginTeam = async (req, res) => {
    try {
        const { teamID, password } = req.body;
        const team = await teamModel.findOne({ teamID: teamID });
        if (!team) {
            return res.status(400).json({ message: "Invalid teamID or password" });
        }
        const isMatch = await team.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid teamID or password" });
        }
        const token = team.generateAuthToken();
        console.log("Team logged in:", teamID);
        res.status(200).json({ token });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Team Logout (Optional - for token blacklist)
module.exports.logoutTeam = async (req, res) => {
    console.log("Logging out team:", req.team._id);
    try {
        // If you implement blacklist, add token to blacklist here
        
        res.status(201).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: error.message });
    }
};