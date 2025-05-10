const mongoose = require('mongoose');

const BookingphysioSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetRegister',
        required: true
    },
    physio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhysioTherapy',
        required: true
    },
    fcmToken: {
        type: String,
    },
    date: {
        type: String,
        required: true
    },
    bookingRef: {
        type: String,
    },
    time: {
        type: String,
        required: true,
        trim: true
    },
    cancelledBy: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rescheduled'],
        default: 'Pending'
    },
    notes: {
        type: String,
        trim: true
    },
    paymentComplete: {
        type: Boolean,
        default: false
    },
    paymentCollectionType: {
        type: String,
        enum: ['Online', 'In Store'],
        default: 'Online'
    },
    paymentDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    lastNotified: {
        type: Date
    },

}, { timestamps: true });

module.exports = mongoose.model('Bookingphysio', BookingphysioSchema);
