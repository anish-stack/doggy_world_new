const mongoose = require('mongoose');

const CakeFlavourSchema = new mongoose.Schema({
    image: {
        url: {
            type: String,
            required: false,
            trim: true
        },
        publicId: {
            type: String,
            required: false,
            trim: true
        }
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CakeFlavour', CakeFlavourSchema);