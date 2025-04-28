const mongoose = require('mongoose');

const GroomingServiceSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: [true, 'Service type is required'],
            trim: true,
        },
        imageUrl: {
            url: {
                type: String,
                required: [true, 'Image URL is required'],
                trim: true,
            },
            public_id: {
                type: String,
                required: [true, 'Public ID is required'],
                trim: true,
            },
        },
        description: {
            type: String,
            trim: true,
        },
        startPrice: {
            type: Number,
            required: [true, 'Start price is required'],
            min: [0, 'Start price cannot be negative'],
        },
        endPrice: {
            type: Number,
            required: [true, 'End price is required'],
            min: [0, 'End price cannot be negative'],
        },
        anyOffer: {
            type: Boolean,
            default: false,
        },
        offer: {
            type: String,
            trim: true,
            default: '',
        },
        priceVary: {
            type: Boolean,
            default: false,
        },
        bookingAccept: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('GroomingService', GroomingServiceSchema);
