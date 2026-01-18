const productModel = require('../models/product.model');


module.exports.addProduct = async ({
    productID,name,description,startingPrice,
}) => {
    if (!productID ||!name || !startingPrice) {
        throw new Error('All fields are required');
    }
    const product = productModel.create({
        productID,
        name,
        description,
        startingPrice
    });

    return product;
}