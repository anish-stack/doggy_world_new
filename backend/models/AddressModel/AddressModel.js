const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zipCode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        default: 'IN'
    },
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
        
    }
}, {
    timestamps: true,
});

const Address = mongoose.model('Address', AddressSchema);

module.exports = Address;