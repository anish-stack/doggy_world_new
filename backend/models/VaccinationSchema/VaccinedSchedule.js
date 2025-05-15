const mongoose = require('mongoose');

// Schedule Schema for vaccine
const ScheduleSchema = new mongoose.Schema({
    schedule: [{
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
        },
        vaccines: {
            type: String,
            required: true
        },
        note:{
              type: String,
        },
        status: {
              type: String,
            enum: ['Pending', 'Cancelled', 'Confirmed', 'Completed', 'Facing Error', 'Rescheduled'],
        }
    }],
    whichOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VaccinationBooking'
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
