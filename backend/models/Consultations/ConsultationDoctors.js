const mongoose = require('mongoose');

const ConsultationDoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        url: {
            type: String,
            required: true,
            trim: true
        },
        public_id: {
            type: String,
            required: true,
            trim: true
        }
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    price: {
        type: Number,
        required: true,
        min: 200
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    position: {
        type: Number,
        required: true

    },
    tags: {
        type: [String],
        default: []
    },
    availableTimeSlots: [
        {
            whichPart: {
                type: String,
                enum: ['Morning', 'Afternoon', 'Evening'],
                required: true
            },
            startTime: {
                type: Date,
                required: true
            },
            endTime: {
                type: Date,
                required: true
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('ConsultationDoctor', ConsultationDoctorSchema);
