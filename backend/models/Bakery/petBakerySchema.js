const mongoose = require('mongoose');

// Pet Bakery Schema
const petBakerySchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true,
    },
    screenName: {
        type: String,
        trim: true,
    },
    tag: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },

    position: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('PetBakery', petBakerySchema);
