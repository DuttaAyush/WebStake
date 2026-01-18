const express = require('express');
const router = express.Router();
const productService = require('../services/product.service');
const { authTeam } = require('../middleware/auth.middleware');

// Route to add a new product (auction item)    
router.post('/add', async (req, res) => {
    try {
        const { productID, name, description, startingPrice, } = req.body;
        const product = await productService.addProduct({
            productID, name, description, startingPrice,
        });
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;