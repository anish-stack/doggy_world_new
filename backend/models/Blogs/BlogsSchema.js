const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        default:'Doggy World Care'
        
    },
    category: {
        type: String,
      
        trim: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    imageUrl: [{
        url: {
            type: String,
        },
        public_id: {
            type: String,
        }
    }],

    isPublished: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);