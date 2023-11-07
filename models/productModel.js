const mongoose = require('mongoose');
const category = require('./categoryModel')

const productschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    is_Delelted: {
        type: Boolean,
        default: false
    },
    stock_count: {
        type: Number,
        required: true
    },
    offer: {
        discountPercentage: {
            type: Number,
            default: 0, 
        },
        startDate: Date, 
        endDate: Date,  
       
    }
})

const product = mongoose.model('products', productschema);

module.exports = product;