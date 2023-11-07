const mongoose = require('mongoose');

const orderCancelSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    payment : {
        type: String,
        enum: ['Razorpay', 'Paytm', 'Cash on Delivery'],       
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Declined'],
        default: 'Pending',
    },
    
    returnedProducts: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
            },
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
   
}, { timestamps: true });

module.exports = mongoose.model('refund', orderCancelSchema);
