const mongoose = require('mongoose');

// Cake Booking Schema
const CakeBookingSchema = new mongoose.Schema({
    cakeDesign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CakeDesign',
        required: true
    },
    cakeFlavor: { // Changed to camelCase
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CakeFlavour',
        required: true
    },
    size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CakeSize',
        required: true
    },
    type: {
        type: String,
        enum: ['Pickup At Store', 'Delivery'],
        default: 'Delivery',
        required: true
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    bookingStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Dispatched', 'Delivered'],
        default: 'Pending',
        required: true
    },

    confirmedDate: { // Fixed typo and changed to camelCase
        type: Date,
    },
    cancelledDate: { // Fixed typo and changed to camelCase
        type: Date,
    },
    dispatchedDate: { // Fixed typo and changed to camelCase
        type: Date,
    },
    deliveredDate: { // Fixed typo and changed to camelCase
        type: Date,
    },

    paymentDetails: {
        razorpayOrderId: {
            type: String,
            required: true
        },
        razorpayPaymentId: {
            type: String,
            required: true
        },
        razorpaySignature: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Success', 'Failed'],
            default: 'Pending',
            required: true
        }
    },
    
    deliveryInfo: {
        customerName: {
            type: String,
            required: true,
            trim: true
        },
        phoneNumber: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /\d{10}/.test(v);
                },
                message: 'Invalid phone number!'
            }
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        typeOfAddress: {
            type: String,
            enum: ['Home', 'Office', 'Other'],
            default: 'Home',
            required: true
        },
        landmark: {
            type: String,
            trim: true
        }
    },

    pickupDate: {
        type: Date,
    },

    specialInstructions: {
        type: String,
        trim: true,
        maxLength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

CakeBookingSchema.index({ cakeDesign: 1, pet: 1, clinic: 1, type: 1, pickupDate: 1 });

module.exports = mongoose.model('CakeBooking', CakeBookingSchema);
