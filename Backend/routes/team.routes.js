const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { authTeam } = require('../middleware/auth.middleware');

router.post('/register', teamController.registerTeam);
router.post('/login', teamController.loginTeam);

// Protected route
router.post('/logout', authTeam, teamController.logoutTeam);

// Protected routes (require authentication)
router.get('/profile', authTeam, teamController.getProfile);
router.get('/bid-history', authTeam, teamController.getBidHistory);

// Public routes
router.get('/live-auction', teamController.getLiveAuction);
router.get('/leaderboard', teamController.getLeaderboard);

module.exports = router;