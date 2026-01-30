const mongoose = require('mongoose');

const GalleryItemSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    imageUrl: {
        type: String,
        required: [true, 'Please add an image URL']
    },
    thumbnailUrl: String,
    category: {
        type: String, // e.g., 'Event', 'Campus', 'Student Life'
        default: 'General'
    },
    tags: [String],
    isFeatured: {
        type: Boolean,
        default: false
    },
    event: {
        type: mongoose.Schema.ObjectId,
        ref: 'Event'
    },
    uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create text index for search
GalleryItemSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

module.exports = mongoose.model('GalleryItem', GalleryItemSchema);
