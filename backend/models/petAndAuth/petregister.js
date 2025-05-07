const mongoose = require('mongoose');

const petRegisterSchema = new mongoose.Schema({
    petType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    petname: {
        type: String,
        required: true,
        trim: true
    },
    petOwnertNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    petdob: {
        type: Date,
        required: false
    },
    petbreed: {
        type: String,
        default: '',
        trim: true
    },
    isGivePermisoonToSendNotification: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Number,
        required: false
    },
    otp_how_many_send: {
        type: Number,
        default: 0
    },
    isBlockForOtp: {
        type: Boolean,
        default: false
    },
    otp_expired_time: {
        type: Date,
        required: false
    },
    _newPetOwnerNumber: {
        type: String,

        unique: true,
        trim: true
    },
    is_verify_pet: {
        type: Boolean,
        default: false
    }
  
}, { timestamps: true });

const PetRegister = mongoose.model('PetRegister', petRegisterSchema);

module.exports = PetRegister;
