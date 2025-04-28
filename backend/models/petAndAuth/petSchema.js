const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    petType: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Pet = mongoose.model('Pet', petSchema);

module.exports = Pet;
