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

            trim: true,
        },
        public_id: {
            type: String,

            trim: true,
        },
    },
    tag:{
        type: String,

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