const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'], 
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  referenceId: {
    type: String, 
  }
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
  transactions: [transactionSchema] 
});

module.exports = mongoose.model('wallets', walletSchema);
