const teamModel = require('../models/team.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const blacklistModel = require('../models/blacklistToken.model');
const productModel = require('../models/product.model');

module.exports.authTeam = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const isBlacklisted = await blacklistModel.findOne({token});
    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const team = await teamModel.findById(decoded._id);
        req.team = team;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

