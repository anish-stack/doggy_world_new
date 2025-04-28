const mongoose = require('mongoose');

// Booking Grooming Schema
const BookingGroomingSchema = new mongoose.Schema({
  
    general_booking: {
        type: Boolean,
        default: false
    },
  
    created_by_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    },
    type: {
        type: String,
        required: true
    },
    date_of_service: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    is_cancel_by_user: {
        type: Boolean,
        default: false
    },
    is_cancel_user_reason: {
        type: String,
        default: ''
    },
    is_cancel_admin_reason: {
        type: String,
        default: ''
    },
    is_cancel_admin: {
        type: Boolean,
        default: false
    },
    service_complete: {
        type: Boolean,
        default: false
    },
    feedback: {
        type: String,
        default: ''
    },
    is_rate: {
        type: Boolean,
        default: false
    },
    booking_status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled','rescheduled'], 
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('BookingGrooming', BookingGroomingSchema);
