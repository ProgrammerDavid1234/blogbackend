const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    path: {
      type: String,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    averageReadTime: {
      type: Number, // seconds or minutes (decide later in analytics logic)
      default: 0,
    },
    totalReadTime: {
      type: Number,
      default: 0,
    },
    devices: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
    },
    referrers: [
      {
        source: String, // e.g. "direct", "google", "twitter"
        count: { type: Number, default: 0 },
      },
    ],
    countries: [
      {
        code: String, // e.g. "NG"
        name: String,
        count: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

AnalyticsSchema.index({ post: 1, date: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
