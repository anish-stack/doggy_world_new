const mongoose = require('mongoose');

const ServiceBannerSchema = new mongoose.Schema({
    imageUrl: [
        {
            url: {
                type: String,
                required: true,
                trim: true
            },
            public_id: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    position: {
        type: Number,
    },
    type: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ServiceBanner', ServiceBannerSchema);
