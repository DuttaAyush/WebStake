const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
// const { authAdmin } = require('../middlewares/auth.middleware'); // For admin-only routes

// Public routes
router.get('/available', productController.getAvailableProducts);
router.get('/all', productController.getAllProducts);
router.get('/:productId', productController.getProductById);

// Admin routes (add authAdmin middleware when ready)
router.post('/create', productController.createProduct);

module.exports = router;

