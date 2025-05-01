const mongoose = require("mongoose");

const DisplaySchemaOfDoctor = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        specialization: { type: String, default: null },
        experience: { type: String, default: null },
        description: { type: String, default: null },
        is_best: { type: Boolean, default: false },
        position: { type: Number, default: null },
        imageUrl: {
            url: {
                type: String,
                trim: true,
            },
            public_id: {
                type: String,
                trim: true,
            },
        },
        
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("DisplayDoctor", DisplaySchemaOfDoctor);
