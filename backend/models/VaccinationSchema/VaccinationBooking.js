const mongoose = require('mongoose');

const VaccinationBookingSchema = new mongoose.Schema({

    vaccines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccination',
        required: true
    }],

    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true
    },

    bookingType: {
        type: String,
        enum: ['Home', 'Clinic'],
        default: 'Home'
    },

    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },

    selectedDate: {
        type: Date,
        default: Date.now
    },

    selectedTime: {
        type: Date,
        default: Date.now
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
        ref: 'LabVaccinePayment'
    },

    status: {
        type: String,
        enum: ['Pending', 'Cancelled', 'Completed', 'Facing Error'],
        default: 'Pending'
    },

    hasRated: {
        type: Boolean,
        default: false
    },

    bookingRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }

}, { timestamps: true });

VaccinationBookingSchema.index({ clinic: 1, pet: 1, selectedDate: 1 });

module.exports = mongoose.model('VaccinationBooking', VaccinationBookingSchema);
