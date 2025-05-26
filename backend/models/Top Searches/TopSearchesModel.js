const mongoose = require('mongoose');

const TopSearchesSchema = new mongoose.Schema(
    {
        searchTerm: {
            type: String,
            required: true,
            trim: true,
        },
        position: {
            type: Number,
            required: true,
            min: 1,
        },
        active: {
            type: Boolean,
            default: true,
        },
        id: {
            type: String,
            required: true,
            trim: true,
        },
        route: {
            type: String,
            required: true,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('TopSearch', TopSearchesSchema);