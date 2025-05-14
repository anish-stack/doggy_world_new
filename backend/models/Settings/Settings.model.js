const mongoose = require('mongoose');

const bookingTimeSchema = new mongoose.Schema({
    start: {
        type: String, // e.g. "08:00"
        required: true
    },
    end: {
        type: String, // e.g. "18:00"
        required: true
    },
    gapBetween: {
        type: Number, // in minutes
        default: 30
    },
    perGapLimitBooking: {
        type: Number,
        default: 5
    },
    whichDayBookingClosed: {
        type: [String], // e.g., ["Sunday", "Saturday"]
        default: []
    },
    disabledTimeSlots: [
        {
            type: {
                type: String,
                enum: ['single', 'range'],
                required: true
            },
            time: {
                type: String
            },
            start: {
                type: String
            },
            end: {
                type: String
            }
        }
    ]
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
    appName: {
        type: String,
        default: 'Doggy World Care',
        trim: true
    },


    imagingTestBookingTimes: bookingTimeSchema,
    vaccinationBookingTimes: bookingTimeSchema,
    labTestBookingTimes: bookingTimeSchema,
    groomingBookingTimes: bookingTimeSchema,
    physiotherapyBookingTimes: bookingTimeSchema,

    // Support and contact
    supportEmail: {
        type: String,
        trim: true,
        lowercase: true
    },

    supportNumber: {
        type: String,
        trim: true
    },

    website: {
        type: String,
        trim: true
    },

    logo: {
        type: String, // URL or path
        trim: true
    },

    appIcon: {
        type: String, // URL or path
        trim: true
    },

    version: {
        type: String,
        default: '1.0.0'
    },
    isTaxCollect: {
        type: Boolean
    },
    taxPercetange: {
        type: Number,

    },
    freeThressHoldeDeliveryFee: {
        type: Number,
    },
    isFreeDeliveryOnAppAllProducts: {
        type: Boolean
    },
    
    base_delivery_fee: {
        type: Number,
    },


}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', SettingsSchema);
