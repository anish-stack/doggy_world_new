const mongoose = require('mongoose');

const BakeryAndShopBookingSchema = new mongoose.Schema({
    // Customer and pet information
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetRegister',
        required: true
    },

    orderNumber: {
        type: String,
       
        required: true,
        default: () => 'ORD-' + Math.floor(100000 + Math.random() * 900000)
    },


    items: [
        {

            hasVariant: {
                type: Boolean,
                default: false
            },
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'items.variantModel',
                required: function () {
                    return this.hasVariant;
                }
            },
            variantModel: {
                type: String,
                enum: ['petBakeryProduct.variants', 'PetShopProduct.variants'],
                required: function () {
                    return this.hasVariant;
                }
            },
            variantName: String,

            // Product information
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'items.itemModel',
                required: true
            },
            itemModel: {
                type: String,
                enum: ['petBakeryProduct', 'PetShopProduct'],
                required: true
            },

            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1']
            },
            unitPrice: {
                type: Number,
                required: true
            },
            subtotal: {
                type: Number,
                required: true
            }
        }
    ],

    // Payment information
    paymentDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    fcmToken: {
        type: String,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'cod', 'Online', 'Credit Card', 'online', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'],
        default: 'Cash on Delivery'
    },

    paymentStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    isPaid: {
        type: Boolean,
        default: false
    },

    // Discount and coupon information
    couponApplied: {
        type: Boolean,
        default: false
    },
    couponCode: String,
    discountAmount: {
        type: Number,
        default: 0
    },

    // Price calculation fields
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

    // Delivery information
    deliveryInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    deliveryDate: {
        type: Date,
        required: true
    },

    specialInstructions: {
        type: String,
        trim: true,
        maxLength: 500
    },
    deliveredAt: {
        type: Date,
    },

    // Order status
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Order Placed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending'
    },

    // Status history with timestamps for audit trail
    statusHistory: [
        {
            status: {
                type: String,
                enum: ['Pending', 'Confirmed', 'Order Placed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            note: String,

        }
    ],

    // Admin notes for internal use
    adminNotes: [
        {
            note: String,

            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});


BakeryAndShopBookingSchema.index({ orderNumber: 1 });
BakeryAndShopBookingSchema.index({ customerId: 1 });
BakeryAndShopBookingSchema.index({ status: 1 });
BakeryAndShopBookingSchema.index({ createdAt: -1 });


BakeryAndShopBookingSchema.pre('save', function (next) {
    // If status has changed, add to status history
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: Date.now()
        });
    }
    next();
});

// Virtual field for order age
BakeryAndShopBookingSchema.virtual('orderAge').get(function () {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('BakeryAndShopBooking', BakeryAndShopBookingSchema);