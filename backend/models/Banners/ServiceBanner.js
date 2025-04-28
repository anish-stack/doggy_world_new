const mongoose = require('mongoose');

//for all service whcih we offer 
const ServiceBannerSchema = new mongoose.Schema({
    imageUrl: {
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
    },
    type: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ServiceBanner', ServiceBannerSchema);
