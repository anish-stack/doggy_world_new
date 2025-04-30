const mongoose = require('mongoose');

const PetShopSubCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    position: {
        type: Number
    },
    active: {
        type: Boolean,
        default: false
    },
    parentCategory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetShopCategory',
        required: true,
    }],

}, { timestamps: true });

module.exports = mongoose.model('PetShopSubCategory', PetShopSubCategorySchema);