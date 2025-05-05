const mongoose = require('mongoose');

//for a banner which shows on home
const HomeBannerSchema = new mongoose.Schema({
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
    link: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    position:{

    },

},{timestamps:true});

module.exports = mongoose.model('HomeBanner', HomeBannerSchema);