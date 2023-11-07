const products = require('../../models/productModel')
const category = require('../../models/categoryModel')

const addOfferOnProduct = async (req, res) => {
    try {
        const { productId, offerPercentage, startDate, endDate } = req.body;

        const product = await products.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const now = new Date();
        const offer = product.offer;

        if (offer && offer.startDate <= now && offer.endDate >= now) {

            return res.json({ offerValid: true });
        } else {
            product.offer.discountPercentage = offerPercentage;
            product.offer.startDate = startDate;
            product.offer.endDate = endDate;

            const updatedProduct = product.save();
            if (updatedProduct) {
                return res.json({ offerAdded: true });
            } else {
                return res.json({ offerAdded: false });
            }
        }
    } catch (error) {

    }
}
const addOfferOnCategory = async (req, res) => {
    try {
        const { categoryId, offerPercentage, startDate, endDate } = req.body;
        console.log(categoryId, offerPercentage, startDate, endDate);
        let offerAdded = false;
        let offerAlreadyAdded = false;

        const productsOnSameCategory = await products.find({ category: categoryId });

        const now = new Date();

        for (const product of productsOnSameCategory) {
            const offer = product.offer;
            if (offer && offer.startDate <= now && offer.endDate >= now) {
                offerAlreadyAdded = true;
                console.log("Offer already added for product: " + product.name);
            } else {
                product.offer.discountPercentage = offerPercentage;
                product.offer.startDate = startDate;
                product.offer.endDate = endDate;

                const updatedProduct = await product.save();
                if (updatedProduct) {
                    console.log("Offer added for product: " + updatedProduct.name);
                    offerAdded = true;
                } else {
                    console.log("Failed to update product: " + product.name);
                }
            }
        }

        return res.json({ offerAdded, offerAlreadyAdded });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
}
module.exports = {
    addOfferOnProduct,
    addOfferOnCategory
}