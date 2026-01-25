const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please add a valid email',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'subscribed', 'unsubscribed', 'bounced'],
      default: 'pending',
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: Date,
    source: {
      type: String,
      enum: ['website', 'event', 'admin', 'import', 'other'],
      default: 'website',
    },
    confirmationToken: String,
    confirmationTokenExpires: Date,
    lastEmailSentAt: Date,
    lastOpenedAt: Date,
    lastClickedAt: Date,
    totalEmailsSent: {
      type: Number,
      default: 0,
    },
    totalOpens: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      location: {
        country: String,
        city: String,
      },
    },
    tags: [{ type: String, trim: true }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries by email and status
SubscriberSchema.index({ email: 1 });
SubscriberSchema.index({ status: 1 });

// Text index for email and tags (for search)
SubscriberSchema.index({ email: 'text', tags: 'text' });

module.exports = mongoose.model('Subscriber', SubscriberSchema);
