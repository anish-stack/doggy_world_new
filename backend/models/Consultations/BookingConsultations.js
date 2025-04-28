const mongoose = require('mongoose');

const BookingConsultationSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetRegister',
        required: true
    },
    consultationType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true
    },
    
    date: {
        type: Date,
        required: true
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
        razorpay_order_id: {
            type: String,
            trim: true
        },
        razorpay_payment_id: {
            type: String,
            trim: true
        },
        payment_status: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed'],
            default: 'Pending'
        }
    }

}, { timestamps: true });

module.exports = mongoose.model('BookingConsultation', BookingConsultationSchema);
