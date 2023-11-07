const orders = require('../../models/orderModel');
const users = require('../../models/userModel')
const products = require('../../models/productModel');
const carts = require('../../models/cartModel')
const coupons = require('../../models/couponModel');
const refunds = require('../../models/refundModel');
const wallets = require('../../models/walletModel')
const Razorpay = require('razorpay');
const crypto = require("crypto");
require('dotenv/config');

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
})



const updateProductStock = async (productId, purchasedQuantity, res) => {
    const product = await products.findById(productId);
    if (product.stock_count >= purchasedQuantity) {
        product.stock_count -= purchasedQuantity;
        return product.save();
    }
};

const createNewOrder = async (userId, transformedItems, totalAmountDisplayed, address, paymentMethod, couponCode, discountPrice) => {
    let newOrder = null;
    if (couponCode !== 'undefined' && couponCode !== null) {
        const couponInformation  = {
            couponCode : couponCode,
            couponDiscount : discountPrice
        }
        newOrder = new orders({
            userId,
            items: transformedItems,
            totalAmount: totalAmountDisplayed,
            shippingAddress: {
                fullName: address.fullName,
                houseName: address.houseName,
                street: address.street,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
            },
            paymentMethod,
            couponInformation,
        });
    } else {
        newOrder = new orders({
            userId,
            items: transformedItems,
            totalAmount: totalAmountDisplayed,
            shippingAddress: {
                fullName: address.fullName,
                houseName: address.houseName,
                street: address.street,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
            },
            paymentMethod
        });

    }

    return newOrder.save();
};

const applyCoupon = async (couponCode, userId) => {

    const code = couponCode.toUpperCase();
    const coupon = await coupons.findOne({ code });

    coupon.usedBy.push(userId);
    coupon.currentUses += 1;

    await coupon.save();
};

const placeOrder = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user.is_Blocked) {
            const { selectedAddress, paymentMethod, totalPrice, newTotalAmount } = req.body;
            let totalAmountDisplayed = 0;
            const userId = req.session.userData._id;

            const codeObject = req.session[userId];

            let couponCode = null;
            let discountPrice = 0;
            if (codeObject) {
                couponCode = codeObject.code.code;
                discountPrice = codeObject.discountAmount;
                
            }
            if (newTotalAmount === 0) {
                totalAmountDisplayed = totalPrice;
            } else {
                totalAmountDisplayed = newTotalAmount;
            }
            const totalAmount = parseInt(totalAmountDisplayed);
            console.log(couponCode, discountPrice)

            const cart = await carts.findOne({ userId }).populate('items.productId');
            const transformedItems = cart.items.map(cartItem => ({
                productId: cartItem.productId,
                quantity: cartItem.quantity,
                price: cartItem.productId.price // Replace with actual price calculation logic
            }));
            for (const item of cart.items) {
                const result = await updateProductStock(item.productId, item.quantity, res);
                console.log(result, "result")
                if (!result) {
                    const product = await products.findById(item.productId);
                    return res.json({ status: false, message: `Insufficient stock for product ${product.name}` });; // Stop further execution if there's a stock issue
                }
            }

            const user = await users.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (selectedAddress < 0 || selectedAddress >= user.address.length) {
                return res.status(400).json({ error: 'Invalid address index' });
            }

            const address = user.address[selectedAddress];
            if (couponCode !== 'undefined' && couponCode !== null) {
                await applyCoupon(couponCode, userId);
            }

            const savedOrder = await createNewOrder(userId, transformedItems, totalAmount, address, paymentMethod, couponCode, discountPrice);

            console.log(savedOrder);

            if (paymentMethod === 'Cash on Delivery') {
                console.log("in if condition")
                await carts.deleteMany({ userId });
                res.status(200).json({ codStatus: true })
            } else if (paymentMethod === 'Razorpay') {
                const options = {
                    amount: totalAmount * 100,
                    currency: "INR",
                    receipt: savedOrder._id,
                    payment_capture: 1,
                };

                instance.orders.create(options, async (error, order) => {
                    if (error) {
                        console.error('Error creating order:', error);

                    } else {
                        console.log('Order created:', order);
                        await carts.deleteMany({ userId });
                        res.json(order);

                    }
                });
            } else if (paymentMethod === 'Wallet') {
                console.log("wallet payment")
                const wallet = await wallets.findOne({ userId: userId });
                if (!wallet) {
                    orders.deleteOne({ _id: savedOrder._id })
                    res.json({ status: false, message: 'User does not have a wallet' });
                } else if (wallet.balance < totalAmount) {

                    orders.deleteOne({ _id: savedOrder._id })
                    res.json({ status: false, message: 'Insufficient wallet balance' });

                } else {
                    wallet.balance -= totalAmount;
                    const updatedWallet = await wallet.save();
                    if (updatedWallet) {
                        //savedOrder._id
                        await carts.deleteMany({ userId });
                        const order = await orders.updateOne({ _id: savedOrder._id }, { $set: { status: 'Placed' } });
                        res.json({ status: true });
                    }
                }



            }

        } else {
            req.session.destroy();
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
    }
};



const orderConfirmation = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user.is_Blocked) {
            console.log(" in order confirmation")
            const userId = req.session.userData._id;
            const order = await orders.findOne({ userId }).sort({ createdAt: -1 }).populate('items.productId');

            res.render('orderConfirmation', { order })
        } else {
            req.session.destroy()
            res.redirect('/')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const viewOrders = async (req, res) => {
    try {
        const user = req.session.userData;
        const userId = user._id;
        const pageSize = 3;
        if (!user.is_Blocked) {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * pageSize;
            const userOrders = await orders
                .find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .populate('items.productId');

                const totalOrdersCount = await orders.countDocuments({ userId });
            const totalPages = Math.ceil(totalOrdersCount / pageSize);

            res.render('viewOrders', {
                userOrders,
                currentPage: page,
                totalPages: totalPages,
            });
        } else {
            req.session.destroy()
            res.redirect('/')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const cancelOrder = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user.is_Blocked) {
            const userId = req.session.userData._id;
            const { orderId, cancelReason } = req.body
            console.log(userId, orderId, cancelReason) 
            const order = await orders.findById(orderId)
            const items = order.items;
            
            // Iterate through the items and update product quantities
            for (const item of items) {
                const productId = item.productId;
                const quantity = item.quantity;
                
                // Update the product quantity in the products collection
                const product = await products.findById(productId);
                product.stock_count += quantity;
                await product.save();
            }
            const orderStatus = await orders.updateOne({ _id: orderId }, { $set: { status: 'Requested For Cancel' } });
            console.log(orderStatus)
            if (order.paymentMethod !== "Cash on Delivery") {
                const payment = order.paymentMethod;
                const amount = order.totalAmount;
                const refund = new refunds({
                    userId,
                    orderId,
                    amount,
                    payment,
                    reason: cancelReason

                })
                const refundData = await refund.save();
            }
            res.json({ success: true });
        } else {
            req.session.destroy()
            res.redirect('/')
        }
    } catch (error) {
        console.log(error.message)
    }
}
const verifyPayment = async (req, res) => {
    try {
        console.log("in verify payment")
        const { payment, order } = req.body;
        console.log(payment, order)

        let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);

        hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_pyment_id);

        hmac = hmac.digest('hex')
        console.log(hmac)
        console.log(hmac == payment.razorpay_signature)
        /* if (hmac == payment.razorpay_signature) {
             const order = changePaymentStatus(order.receipt)
 
             console.log("payment success ", order)
             res.json({ Status: true })
         } else {
             console.log("payment failed")
             res.json({ Status: false })
         }*/
        const orderPlaced = changePaymentStatus(order.receipt)
        res.json({ Status: true })
    } catch (error) {
        console.log(error.message);

    }
}
const changePaymentStatus = async (orderId) => {
    try {
        console.log("in changePaymentStatus")
        const order = await orders.updateOne({ _id: orderId }, { $set: { status: 'Placed' } });
        console.log(receipt, order);
        return order;
    } catch (error) {

    }

}

module.exports = {
    placeOrder,
    orderConfirmation,
    viewOrders,
    cancelOrder,
    verifyPayment
}