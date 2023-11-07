const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      link: {
        type: String,       
      },
    
      created_at: {
        type: Date,
        default: Date.now,
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
    
})

module.exports = mongoose.model('Banner',bannerSchema)