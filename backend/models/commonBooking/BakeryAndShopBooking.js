const mongoose = require('mongoose');

const BakeryAndShopBookingSchema = new mongoose.Schema({

    items: [
        {
            quantity: { 
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1'], 
            },
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: ['petBakeryProduct', 'PetShopProduct'],
                required: true, 
            }
        }
    ],

    paymentDetails: {
        razorpayOrderId: {
            type: String,
            required: true,
        },
        razorpayPaymentId: {
            type: String,
            required: true,
        },
        razorpaySignature: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Success', 'Failed'],
            default: 'Pending',
            required: true,
        },
    },

    deliveryInfo: {
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /\d{10}/.test(v);
                },
                message: 'Invalid phone number!',
            },
        },
        address: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, 'Address must be at least 10 characters long'], 
            maxlength: [200, 'Address must be less than 200 characters long'],
        },
        typeOfAddress: {
            type: String,
            enum: ['Home', 'Office', 'Other'],
            default: 'Home',
            required: true,
        },
        landmark: {
            type: String,
            trim: true,
        },
    },


    deliveryDate: {
        type: Date,
    },

    specialInstructions: {
        type: String,
        trim: true,
        maxLength: 500,
    },

    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Dispatched', 'Returned', 'Delivered'],
        default: 'Pending',
    },
    ConfirmedDate:{
        type: Date,
    },
    CancelledDate:{
        type: Date,
    },
    DispatchedDate:{
        type: Date,
    }

}, {
    timestamps: true,
});

module.exports = mongoose.model('BakeryAndShopBooking', BakeryAndShopBookingSchema);
