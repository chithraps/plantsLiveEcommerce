const users = require('../../models/userModel')
const orders = require('../../models/orderModel')
const refunds = require('../../models/refundModel')
const wallets = require('../../models/walletModel')


const viewAllOrders = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const ordersPerPage = 10;
        const skipCount = (page - 1) * ordersPerPage;
        const statusFilter = req.query.status;
        console.log(statusFilter);
        const filter = {};

        if (statusFilter) {
            filter.status = statusFilter;
        }
        const orderData = await orders
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skipCount)
            .limit(ordersPerPage)
            .populate('items.productId')
            .populate('userId')
            .select('+couponInformation');

        const totalOrders = await orders.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / ordersPerPage);
        
        res.render('allOrders', { orders: orderData, page, totalPages: totalPages, });
    } catch (error) {

    }
}

const viewOrderedProducts = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const orderData = await orders
            .findOne({ _id: orderId })
            .populate('items.productId');
        if (orderData) {
            res.render('viewOrderedProducts', { orderData })
        } else {
            res.json({ message: "No such product found" })
        }

    } catch (error) {
        console.log(error.message)
    }
}

const updateStatus = async (req, res) => {
    try {
        console.log("in updateStatus")
        const { orderId, orderStatus } = req.body;
        console.log(orderId, orderStatus)
        const order = await orders.updateOne({ _id: orderId }, { $set: { status: orderStatus } });
        res.redirect('/admin/viewAllOrders')
    } catch (error) {
        console.log(error.message)
    }
}

const viewCancelledOrders = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const perPage = 10;
        const skipCount = (page - 1) * perPage;

        const refundData = await refunds
            .find()
            .sort({ createdAt: -1 })
            .skip(skipCount)
            .limit(perPage)

        const totalOrders = await refunds.countDocuments();
        const totalPages = Math.ceil(totalOrders / perPage);
        res.render('viewCancelledOrders', { refund: refundData, page, totalPages: totalPages, });
    } catch (error) {
        console.log(error.message)
    }
}

const approveAndRefund = async (req, res) => {
    try {
        const { orderStatus, orderId, amount, payment, userId, id } = req.body;
        const refund = await refunds.updateOne({ _id: id }, { $set: { status: orderStatus } });
       // const updateOrderStatus = await orders.updateOne({ _id: orderId }, { $set: { status: 'Cancelled' } });
       console.log(orderId)
          const updateOrderStatus = await orders.updateOne({ _id: orderId }, { $set: { status: 'Cancelled' } });
        console.log(updateOrderStatus, "in approve and refund")
        if (orderStatus === 'Approved' && payment === 'Razorpay') {
            const existingWallet = await wallets.findOne({ userId: userId });

            if (existingWallet) {
                const refundAmound = parseInt(amount)
                existingWallet.balance += refundAmound;
                await existingWallet.save();
            } else {

                const newWallet = new wallets({
                    userId: userId,
                    balance: amount,
                });
                await newWallet.save();
            }
            res.json({ success: true });
        } else {
            console.log("Your request for refund is declined by admin panel")
            res.json({ success: false });
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    viewAllOrders,
    viewOrderedProducts,
    updateStatus,
    viewCancelledOrders,
    approveAndRefund
}
