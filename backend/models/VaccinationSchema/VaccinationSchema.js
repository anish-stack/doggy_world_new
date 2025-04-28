const mongoose = require('mongoose');


const VaccinationSchema = new mongoose.Schema({

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
    is_cat: {
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
    WhichTypeOfvaccinations: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TypeOfVaccinationCollection'
    }

}, { timestamps: true });

module.exports = mongoose.model('Vaccination', VaccinationSchema);
