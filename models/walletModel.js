const mongoose = require('mongoose');


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
    
  });
  
  module.exports = mongoose.model('wallets', walletSchema);