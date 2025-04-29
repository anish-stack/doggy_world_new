const mongoose = require('mongoose');

const CakeSizeSchema = new mongoose.Schema({

    price: {
        type: Number,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: false
    },
    position:{
        type: Number,
    },
}, { timestamps: true });

module.exports = mongoose.model('CakeSize', CakeSizeSchema);