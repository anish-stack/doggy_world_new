const mongoose = require('mongoose');


const LabSchema = new mongoose.Schema({

    image: [{
        url: {
            type: String,
            required: true,
            trim: true
        },
        public_id: {
            type: String,
            required: true,
            trim: true
        },
        position: {
            type: Number
        }
    }],

    mainImage: {
        url: {
            type: String,
            required: true,
            trim: true
        },
        public_id: {
            type: String,
            required: true,
            trim: true
        },
    },   // use first image which position of 1

    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount_price: {
        type: Number,
        default: 0
    },
    off_percentage: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    tag: {
        type: String,
        default: ''
    },
    forage: {
        type: String,
        default: ''
    },
    is_dog: {
        type: Boolean,
        default: false
    },
    is_popular: {
        type: Boolean,
        default: false
    },
    is_imaging_test: {
        type: Boolean,
        default: false
    },
    is_cat: {
        type: Boolean,
        default: false
    },
    is_common_for_dog: {
        type: Boolean,
        default: false
    },
    is_common_for_cat: {
        type: Boolean,
        default: false
    },
    small_desc: {
        type: String,
        default: ''
    },
    desc: {
        type: String,
        default: ''
    },
    is_package: {
        type: Boolean,
        default: false
    },
    home_price_of_package: {
        type: Number,
        default: 0
    },
    home_price_of_package_discount: {
        type: Number,
        default: 0
    },
    position: {
        type: Number,
        required: true,
    },
    LabTestdInclueds: [String],
    WhichTypeOfvaccinations: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TypeOfLabCollection'
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model('LabProducts', LabSchema);
