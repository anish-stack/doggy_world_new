const mongoose = require('mongoose');

// Enhanced PhysioTherapy Schema
const PhysioTherapySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxLength: [255, 'Title can\'t be longer than 255 characters'],
    },
    imageUrl: [{
        url: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true,
            match: [/^https?:\/\/.+/i, 'Invalid URL format'],
        },
        public_id: {
            type: String,
            required: [true, 'Public ID is required'],
            trim: true,
        },
        position:{
            type: Number,
        }
    }],
    smallDesc: {
        type: String,
        required: false,
        trim: true,
        maxLength: [255, 'Description is too long, max length is 255 characters'], // Limit for short descriptions
    },
    description: {
        type: String,
        required: false,
        trim: true,
        maxLength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
        type: Number,
        required: false,
        min: [0, 'Price cannot be negative'],
    },
    priceMinute: {
        type: String,
        required: false,
        trim: true,
        maxLength: [100, 'Price per minute cannot exceed 100 characters'],
    },
    discountPrice: {
        type: Number,
        required: false,
        min: [0, 'Discount price cannot be negative'],
    },
    offPercentage:{
        type: Number,
        required: false,
        min: [0, 'Discount Percenatge cannot be negative'],
    },
    popular: {
        type: Boolean,
        required: false,
        default: false,
    },
    active: {
        type: Boolean,
        required: false,
    },
    position: {
        type: Number,
        min: [1, 'Position cannot be less than 1']
    }
}, {
    timestamps: true,
});

// Indexes for optimization
PhysioTherapySchema.index({ title: 1 });
PhysioTherapySchema.index({ popular: 1 });
PhysioTherapySchema.index({ position: 1 });
PhysioTherapySchema.index({ price: 1 });
PhysioTherapySchema.index({ discountPrice: 1 });

module.exports = mongoose.model('PhysioTherapy', PhysioTherapySchema);
