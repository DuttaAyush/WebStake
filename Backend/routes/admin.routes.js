const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
// const { authAdmin } = require('../middlewares/auth.middleware'); // Add admin auth later

// Points Management
router.post('/award-points', adminController.awardPoints);
router.post('/deduct-points', adminController.deductPoints);

// Auction Management
router.post('/start-auction/:productId', adminController.startAuction);
router.post('/end-auction', adminController.endAuctionManual);
router.get('/auction-status', adminController.getAuctionStatus);

// View Data
router.get('/teams', adminController.getAllTeams);
router.get('/products', adminController.getAllProducts);
router.get('/auction-history', adminController.getAuctionHistory);

module.exports = router;