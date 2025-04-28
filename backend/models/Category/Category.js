const mongoose = require('mongoose');

//for showing on a home screen
const CategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        url: {
            type: String,
            required: false,
            trim: true
        },
        publicId: {
            type: String,
            required: false,
            trim: true
        }
    },
    position: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    route: {
        type: String,
        required: false,
        trim: true
    }
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
