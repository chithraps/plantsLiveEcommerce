const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountAmount: {
    type: Number,
  },
  discountPercentage: {
    type: Number,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validTo: {
    type: Date,
    required: true,
  },
  maxUses: {
    type: Number,
    default: null,
  },
  currentUses: {
    type: Number,
    default: 0,
  },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null,
    },
  ],
  maximumDiscount: {
    type: Number,
    default: 1000, 
  },

});


const coupon = mongoose.model('coupons', couponSchema);

module.exports = coupon;
