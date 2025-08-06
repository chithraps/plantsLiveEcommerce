const users = require('../../models/userModel')
const products = require('../../models/productModel');
const carts = require('../../models/cartModel')

const addToCart = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user.is_Blocked) {

            const { productId, quantity } = req.body;
            const quantityToAdd = parseInt(quantity, 10);
            let message = '';
            const userData = req.session.userData;
            if (userData) {
                const userId = userData._id;
                let cartData = await carts.findOne({ userId })
                if (!cartData) {
                    cartData = new carts({ userId, items: [] })
                }

                const existingItem = cartData.items.find((item) => {
                    return item.productId.toString() === productId;
                })
                const stock = await products.findOne({ _id: productId }, { stock_count: 1 });
                if (existingItem) {
                    const productId = existingItem.productId;

                    if ((stock.stock_count - quantityToAdd) >= 0) {
                        existingItem.quantity += quantityToAdd;
                    } else {
                        message = "Current product is out of stock"
                    }

                } else {

                    if ((stock.stock_count - quantityToAdd) >= 0) {
                        cartData.items.push({ productId, quantity });
                    } else {
                        message = "Current product is out of stock"
                    }

                }
                const cartDetails = await cartData.save();
                if (cartDetails) {

                    const productData = await products.findById(productId)
                        .populate('category', 'name');
                    if (productData) {
                        res.render('productView', { product: productData, message })
                    } else {
                        return res.status(404).render('404');
                    }

                }
            }
        } else {
            req.session.destroy()
            res.redirect('/')
        }
    } catch (error) {
        console.log(error.message)
    }
}
const loadViewCart = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user.is_Blocked) {

            const userData = req.session.userData
            let totalPrice = 0;
            const userId = userData._id;
            const userCart = await carts.findOne({ userId }).populate('items.productId')
            console.log("userCart ",userCart)
            if (!userCart) {
                res.render('emptyCart');
            }
            const count = userCart.items.length;
            if (count === 0) {
                res.render('emptyCart')
            }
            userCart.items.forEach((item) => {
                const product = item.productId;
                const itemPrice = product.price;
                console.log(itemPrice," ",product)
                let itemDiscountedPrice = itemPrice;
                if (product.offer && product.offer.startDate <= new Date() && product.offer.endDate >= new Date()) {
                    // Calculate the updated price with the discount
                    const discountPercentage = product.offer.discountPercentage;

                    itemDiscountedPrice = parseInt(itemPrice - (itemPrice * discountPercentage / 100));
                    console.log(discountPercentage, itemDiscountedPrice)
                }

                // Multiply the discounted price by the item's quantity
                totalPrice += itemDiscountedPrice * item.quantity;
                console.log("totalPrice ",totalPrice)
            })


            res.render('viewCart', { cart: userCart, count: count, totalPrice })
        } else {
            req.session.destroy()
            res.redirect('/')
        }
    } catch (error) {
        console.log(" error is ",error.message);
    }
}
const updateCart = async (req, res) => {
    try {
        console.log("in updateCart")
        const user = req.session.userData;
        if (!user.is_Blocked) {
            const { quantity, productId } = req.body;
            console.log(quantity, productId)
            const userId = req.session.userData._id;
            let totalPrice = 0;
            let message = 'In stock';

            const userCart = await carts.findOne({ userId })
            if (!userCart) {
                console.log("user's cart not found")
            }

            const itemIndex = userCart.items.findIndex((item) => {
                return item.productId.toString() === productId;
            });
            if (itemIndex === -1) {
                console.log("Item not found in the cart");
            }
            const stock = await products.findOne({ _id: productId }, { stock_count: 1 });
            if ((stock.stock_count - quantity) >= 0) {
                console.log("quantity less than 0")
                userCart.items[itemIndex].quantity = quantity;
            } else {
                message = "Only a few left; you can't add further"
            }

            const updatedCart = await userCart.save();
            if (updatedCart) {
                console.log("cart updated")
            }
            const cartDetails = await carts.findOne({ userId }).populate('items.productId')

            if (cartDetails) {
                const count = cartDetails.items.length;
                if (count === 0) {
                    // You can send JSON data here to indicate an empty cart
                    res.status(200).json({ message: 'Cart is empty' });
                }

                cartDetails.items.forEach((item) => {
                    const product = item.productId;
                    const itemPrice = product.price;
                    let itemDiscountedPrice = itemPrice;
                    if (product.offer && product.offer.startDate <= new Date() && product.offer.endDate >= new Date()) {
                        // Calculate the updated price with the discount
                        const discountPercentage = product.offer.discountPercentage;

                        itemDiscountedPrice = parseInt(itemPrice - (itemPrice * discountPercentage / 100));
                        console.log(discountPercentage, itemDiscountedPrice)
                    }

                    // Multiply the discounted price by the item's quantity
                    totalPrice += itemDiscountedPrice * item.quantity;
                    console.log(totalPrice)
                })

                // Send JSON data with the updated cart details
                res.status(200).json({ cart: cartDetails, count: count, totalPrice, message });
            }
        } else {
            req.session.destroy()
            res.status(403).json({ message: 'User is blocked' }); // Example response for a blocked user
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'An error occurred' }); // Example response for an error
    }
}
const deleteProduct = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user.is_Blocked) {
            const productId = req.query.productId;

            const userData = req.session.userData;
            let totalPrice = 0;
            const userId = userData._id;
            const userCart = await carts.findOne({ userId })
            if (!userCart) {
                res.render('emptyCart');
            }
            const itemToDeleteIndex = userCart.items.findIndex((item) => {
                return item.productId.toString() === productId;
            });
            console.log(itemToDeleteIndex)
            if (itemToDeleteIndex === -1) {

                console.log("item not found")
            }

            userCart.items.splice(itemToDeleteIndex, 1);

            await userCart.save();
            const cartDetails = await carts.findOne({ userId }).populate('items.productId')

            if (cartDetails) {
                const count = cartDetails.items.length;
                if (count === 0) {
                    res.render('emptyCart')
                }
                console.log(count)
                cartDetails.items.forEach((item) => {
                    totalPrice += item.productId.price * item.quantity;
                })

                res.render('viewCart', { cart: cartDetails, count: count, totalPrice })
            }
        } else {
            req.session.destroy()
            res.redirect('/')
        }

    } catch (error) {
        console.log(error.message)
    }
}



module.exports = {
    addToCart,
    loadViewCart,
    updateCart,
    deleteProduct
}