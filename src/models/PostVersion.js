const mongoose = require('mongoose');

const PostVersionSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    snapshot: {
      type: Object,
      required: true,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    editedAt: {
      type: Date,
      default: Date.now,
    },
    note: String,
  },
  {
    timestamps: true,
  }
);

PostVersionSchema.index({ post: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('PostVersion', PostVersionSchema);
