const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Please add a filename'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Please add a URL'],
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      default: 'image',
    },
    mimeType: String,
    size: {
      type: Number, // bytes
      required: true,
    },
    altText: String,
    title: String,
    description: String,
    folder: {
      type: String,
      default: 'root',
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    provider: {
      type: String,
      enum: ['local', 's3', 'cloudinary', 'other'],
      default: 'local',
    },
    providerId: String,
    width: Number,
    height: Number,
    checksum: String,
    usage: {
      posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
      events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    },
  },
  {
    timestamps: true,
  }
);

MediaSchema.index({ folder: 1, filename: 1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ url: 1 });

MediaSchema.index({ filename: 'text', title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Media', MediaSchema);
