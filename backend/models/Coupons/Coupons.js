const mongoose = require('mongoose');

const CakeCouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
     
    },
    discountType: {
        type: String,
        enum: ["Free Delivery", "flat", "Percentage"]
    },
    min_pucrhase: {
        type: Number
    },
    description: {
        type: String
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    position: {
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        default: "Cakes",
        enum: ["Cakes", "Pet Shop", "Pet Bakery", "Vaccineations", "Lab Test","physiotherapy"]
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CakeCouponSchema);