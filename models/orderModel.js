const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'products',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: String,
      required: true
    }
  },
  ],
  totalAmount: {
    type: Number,
    required: true,

  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Requested For Cancel','Payment Failed'],
    default: 'Pending',
  },
  shippingAddress: {
    fullName: String,
    houseName: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
  },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'Paytm', 'Cash on Delivery', 'Wallet'],
    required: true,
  },
  couponInformation: {
    couponCode: {
      type: String
    },
    couponDiscount: {
      type: Number
    },
  },
  cancelInformation: {
    cancelReason: {
      type: String,
    },
    adminStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Declined'],
      default: 'Pending',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

})

const orders = mongoose.model('orders', orderSchema);

module.exports = orders;