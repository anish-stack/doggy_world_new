const mongoose = require('mongoose');

const LabTestBookingSchema = new mongoose.Schema({

    labTests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabProducts',
        required: true
    }],

    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        default: null
    },

    bookingType: {
        type: String,
        enum: ['Home', 'Clinic'],
        default: 'Home'
    },

    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetRegister',
        required: true
    },
    fcmToken: {
        type: String,
    },
    selectedDate: {
        type: Date,
    },
    rescheduledDate: {
        type: Date,
        default:null
    },

    rescheduledTime: {
        type: String,
        default:null

    },
    selectedTime: {
        type: String,
        default:null
    },

    bookingPart: {
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening'],
        default: 'Morning'
    },


    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    bookingRef: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Cancelled', 'Confirmed', 'Completed', 'Facing Error', 'Rescheduled'],
        default: 'Pending'
    },
    Address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    paymentComplete: {
        type: Boolean,
        default: false
    },
    hasRated: {
        type: Boolean,
        default: false
    },

    couponCode: String,
    couponDiscount: String,
    totalPayableAmount: Number,
    bookingRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    ReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        default:null
    }

}, { timestamps: true });


module.exports = mongoose.model('LabTestBooking', LabTestBookingSchema);
