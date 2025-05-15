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
    rescheduledDate: {
        type: Date,
        default: null
    },
    rescheduledTime: {
        type: String,
        default: null
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
    fcmToken: {
        type: String,
    },
    lastNotified: {
        type: Date
    },
    rating: {
        type: String,
    },
    review: {
        type: String,
    }

}, { timestamps: true });

module.exports = mongoose.model('Bookingphysio', BookingphysioSchema);
