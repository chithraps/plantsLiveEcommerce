const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    fullName : String,
    houseName :String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    
})
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    address : [addressSchema],
    is_Blocked : {
        type : Boolean,
        default : false
    },
    is_verified : {
        type : Boolean,
        default : false
    },
    is_admin : {
        type : Boolean,
        default : false
    }

})

const User = mongoose.model('users', userSchema);

module.exports = User;