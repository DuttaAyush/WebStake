const productModel = require('../models/product.model');

// Get All Available Products (not yet auctioned)
module.exports.getAvailableProducts = async (req, res) => {
    try {
        const products = await productModel.find({ winTeam: null })
            .select('productID name description startingPrice highestBid')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('Error getting available products:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get All Products (including completed auctions)
module.exports.getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find()
            .populate('winTeam', 'name teamID')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products: products.map(product => ({
                productId: product._id,
                productID: product.productID,
                name: product.name,
                description: product.description,
                startingPrice: product.startingPrice,
                highestBid: product.highestBid,
                status: product.winTeam ? 'completed' : 'available',
                winner: product.winTeam ? {
                    teamId: product.winTeam._id,
                    teamName: product.winTeam.name
                } : null
            }))
        });

    } catch (error) {
        console.error('Error getting all products:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Single Product Details
module.exports.getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await productModel.findById(productId)
            .populate('winTeam', 'name teamID points');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            product: {
                productId: product._id,
                productID: product.productID,
                name: product.name,
                description: product.description,
                startingPrice: product.startingPrice,
                currentBid: product.highestBid,
                status: product.winTeam ? 'completed' : 'available',
                winner: product.winTeam ? {
                    teamId: product.winTeam._id,
                    teamName: product.winTeam.name
                } : null
            }
        });

    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add New Product (Admin only - can add auth middleware)
module.exports.createProduct = async (req, res) => {
    try {
        const { productID, name, description, startingPrice } = req.body;

        if (!productID || !name || !startingPrice) {
            return res.status(400).json({ 
                message: 'Product ID, name, and starting price are required' 
            });
        }

        const existingProduct = await productModel.findOne({ productID });
        if (existingProduct) {
            return res.status(400).json({ 
                message: 'Product with this ID already exists' 
            });
        }

        const product = await productModel.create({
            productID,
            name,
            description,
            startingPrice
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: error.message });
    }
};