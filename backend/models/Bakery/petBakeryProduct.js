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

const petBakeryProductSchema = new mongoose.Schema({
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
    mainImage:{
        url:{
            type: String,
            trim: true,
        },
        public_id:{
            type: String,
            trim: true,
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetBakery',
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
        position: {
            type: Number
        }
    }],

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

const petBakeryProduct = mongoose.model('petBakeryProduct', petBakeryProductSchema);

module.exports = petBakeryProduct;
