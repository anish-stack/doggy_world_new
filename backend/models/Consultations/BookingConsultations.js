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
    prescription: {
        description: {
            type: String,
            trim: true,
            default: '',
        },
        medicenSuggest: {
            type: [String],
            default: []
        },
        nextDateForConsultation: {
            type: Date,
            default: null,
        },
        consultationDone: {
            type: Boolean,
            default: false
        },

    },
    prescriptionImages: [
        {
            url: {
                type: String
            },
            public_id: {
                type: String
            },
            date: {
                type: Date
            }
        }
    ],
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConsultationDoctor',
        required: true
    },
    fcmToken: {
        type: String,
    },
    Rating: {
        number: {
            type: Number,

        },
        note: {
            type: String,
            trim: true,
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('BookingConsultation', BookingConsultationSchema);
