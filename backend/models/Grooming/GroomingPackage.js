const mongoose = require('mongoose');

const GroomingPackageSchema = new mongoose.Schema({
    GroomingService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroomingService',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    priceStart: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    priceEnd: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    includes: [
        {
            type: String,
            required: true,
            trim: true
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
}, { timestamps: true });

module.exports = mongoose.model('GroomingPackage', GroomingPackageSchema);
