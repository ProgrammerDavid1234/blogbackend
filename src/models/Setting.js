const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    group: {
      type: String,
      enum: [
        'general',
        'branding',
        'social',
        'email',
        'seo',
        'theme',
        'integrations',
        'security',
        'notifications',
        'other',
      ],
      default: 'general',
    },
    description: String,
    isPublic: {
      type: Boolean,
      default: false,
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

SettingSchema.index({ key: 1 });
SettingSchema.index({ group: 1 });

module.exports = mongoose.model('Setting', SettingSchema);
