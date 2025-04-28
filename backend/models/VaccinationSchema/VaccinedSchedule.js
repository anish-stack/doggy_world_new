const mongoose = require('mongoose');

// Schedule Schema for vaccine
const ScheduleSchema = new mongoose.Schema({

    schedule: [{
        date: {
            type: Date,
            required: true
        },
        vaccines: {
            type: String,
            required: true
        }
    }],
    whichOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VaccinationBooking'
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
