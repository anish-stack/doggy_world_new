const mongoose = require('mongoose');


const CakeDesignSchema = new mongoose.Schema({
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
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    position: {
        type: Number,
        required: true
    },
   
    whichFlavoredCake: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'CakeFlavour'
    }]

}, { timestamps: true });

module.exports = mongoose.model('CakeDesign', CakeDesignSchema);
