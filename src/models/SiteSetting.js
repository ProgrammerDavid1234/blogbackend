const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'NACOS KDU Blog',
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    tagline: {
        type: String,
        default: 'Technology & Innovation',
        maxlength: [200, 'Tagline cannot be more than 200 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    contactEmail: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
            'Please add a valid email'
        ]
    },
    phone: String,
    socialLinks: {
        twitter: String,
        facebook: String,
        linkedin: String,
        instagram: String,
        github: String
    },
    logoUrl: String,
    faviconUrl: String,
    footerText: String,
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Prevent multiple settings documents
SiteSettingSchema.index({ createdAt: 1 }, { unique: true }); // Strategy to ensure singleton-ish specific query or just enforcement in controller

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);
