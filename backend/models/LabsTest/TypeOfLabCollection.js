const mongoose = require('mongoose');

// TypeOfLabCollection Schema
const TypeOfLabCollectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,

    },
    image: {
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
    description: {
        type: String,
        required: true
    },

    is_active: {
        type: Boolean,
        default: true
    },
    position: {
        type: Number,

    }
}, { timestamps: true });

module.exports = mongoose.model('TypeOfLabCollection', TypeOfLabCollectionSchema);
