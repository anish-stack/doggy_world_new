const mongoose = require('mongoose');

const VaccinationBookingSchema = new mongoose.Schema({

    vaccine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccination',
        required: true
    },

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

    selectedTime: {
        type: String,

    },
    rescheduledDate: {
        type: Date,

    },

    rescheduledTime: {
        type: String,

    },

    bookingPart: {
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening'],
        default: 'Morning'
    },

    nextScheduledVaccination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule'
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
    review: String

}, { timestamps: true });


module.exports = mongoose.model('VaccinationBooking', VaccinationBookingSchema);
