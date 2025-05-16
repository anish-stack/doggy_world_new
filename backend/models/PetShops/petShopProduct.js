const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    size: {
        type: String,
    },
    price: {
        type: Number,
        min: 0,
    },
    discountPrice: {
        type: Number,
        min: 0,
    },
    offPercentage: {
        type: Number,
        min: 0,
        max: 100,
    },
    stock: {
        type: Number,
        default: 0,
    },
    inStock: {
        type: Boolean,
        default: true,
    },
    flavour: {
        type: String,
        trim: true,
    }
}, { timestamps: false });

const petShopProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discountPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    offPercentage: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetShopSubCategory',
        required: true,
    },
    imageUrl: [{
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
    }],
    mainImage: {
        url: {
            type: String,
            trim: true,
        },
        public_id: {
            type: String,
            trim: true,
        }
    },
    stock: {
        type: Number,
    },
    isCod: {
        type: Boolean,
        default: false,
    },
    isReturn: {
        type: Boolean,
        default: false,
    },
    freshStock: {
        type: Boolean,
        default: true,
    },
    flavour: {
        type: String,
        trim: true,
    },
    tag: {
        type: String,
        trim: true,
    },
    freeDelivery: {
        type: Boolean,
        default: false,
    },
    isProductAvailable: {
        type: Boolean,
        default: false,
    },
    variants: [variantSchema],
});

const PetShopProduct = mongoose.model('PetShopProduct', petShopProductSchema);

module.exports = PetShopProduct;
