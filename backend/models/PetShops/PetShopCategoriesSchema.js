const mongoose = require('mongoose');


const PetShopCategoriesSchema = new mongoose.Schema({
    backgroundColour: {
        type: String,
    },
    imageUrl: {
        url: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true,
        },
        public_id: {
            type: String,
            required: [true, 'Public ID is required'],
            trim: true,
        },
    },
    title: {
        type: String,
        required: true,
        trim: true
        
    },
    active: {
        type: Boolean,
        default: true
    },
    screen: {
        type: String,
        required: false,
        trim: true
    },

    position: {
        type: Number,
        required: false
    }
}, { timestamps: true });



module.exports = mongoose.model('PetShopCategory', PetShopCategoriesSchema);
