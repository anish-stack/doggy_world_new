const mongoose = require('mongoose');

// Schema for showing available consultations and their offers
const ConsultationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    position:{
        type: Number,
    },
    discount_price: {
        type: Number,
        min: 0
    },
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
    isAnyOffer: {
        type: Boolean,
        default: false
    },
    offer_valid_upto_text: {
        type: String,
        required: false
    },
    offer_valid_upto_date: {
        type: String,
       
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', ConsultationSchema);
