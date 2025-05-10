const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    BookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTestBooking'
    },
    testName: {
        type: String,

    },
    patientName: {
        type: String,

    },
    patientAge: {
        type: Number,

    },
    testDate: {
        type: Date,
        default: Date.now,
    },
    result: {
        type: String,

    },
    labTechnician: {
        type: String,

    },
    pdfLink: {
        url: {
            type: String,
        },
        publicId: {
            type: String,
        }

    },
    TestCompleteTime: {

    },
    SampleCollectionTime: {

    },
    remarks: {
        type: String,
    },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;