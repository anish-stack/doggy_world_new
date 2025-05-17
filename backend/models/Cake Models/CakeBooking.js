const mongoose = require('mongoose');


const CakeBookingSchema = new mongoose.Schema({
    cakeDesign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CakeDesign',
        required: true
    },
    cakeFlavor: {
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
        default: 'Delivery',
        required: true
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic'
    },
    orderNumber: {
        type: String,
        default: function () {
            const randomNum = Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000;
            return `CAKE-${randomNum}`;
        },
        unique: true,
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetRegister',
        required: true
    },
    bookingStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Dispatched', 'Delivered'],
        default: 'Pending',
        required: true
    },

    confirmedDate: {
        type: Date,
    },
    cancelledDate: {
        type: Date,
    },
    dispatchedDate: {
        type: Date,
    },
    deliveredDate: {
        type: Date,
    },

    paymentDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },

    petNameOnCake: {
        type: String,
    },

    pickupDate: {
        type: Date,
    },

    isPaid: {
        type: Boolean,
        default: false
    },

    couponApplied: {
        type: Boolean,
        default: false
    },

    couponCode: String,
    discountAmount: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    Same_Day_delivery: {
        type: Boolean,
    },
    reason: String,
    deliveryInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    fcmToken: String


}, { timestamps: true });

CakeBookingSchema.index({ cakeDesign: 1, pet: 1, clinic: 1, type: 1, pickupDate: 1 });

module.exports = mongoose.model('CakeBooking', CakeBookingSchema);
