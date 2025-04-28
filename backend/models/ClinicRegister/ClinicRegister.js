const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Clinic Schema
const ClinicSchema = new mongoose.Schema({
    clinicName: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
    },
    position:{
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    openTime: {
        type: String,
        required: true,
    },
    closeTime: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    mapLocation: {
            type: String,
    },
    scanTestAvailableStatus: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });



// Hash password before saving
ClinicSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});


ClinicSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('Clinic', ClinicSchema);
