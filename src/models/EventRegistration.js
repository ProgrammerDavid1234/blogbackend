const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: [true, 'Please add an event ID'],
    index: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user ID'],
    index: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'attended', 'no_show'],
    default: 'confirmed'
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    paymentMethod: String,
    transactionId: String,
    paymentDate: Date,
    receiptUrl: String
  },
  checkIn: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: Date,
    checkedInBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate registrations
EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Add a pre-save hook to update the event's registration count
EventRegistrationSchema.pre('save', async function(next) {
  // Only run this if the registration is being confirmed for the first time
  if (this.isNew && this.status === 'confirmed') {
    const Event = this.constructor.model('Event');
    await Event.findByIdAndUpdate(this.event, { $inc: { registrationCount: 1 } });
  }
  
  // Handle status changes
  if (this.isModified('status')) {
    // If status is being changed to cancelled, decrement the count
    if (this.status === 'cancelled' && this._previousStatus !== 'cancelled') {
      const Event = this.constructor.model('Event');
      await Event.findByIdAndUpdate(this.event, { $inc: { registrationCount: -1 } });
    }
    
    // If status is being changed from cancelled to confirmed, increment the count
    if (this.status === 'confirmed' && this._previousStatus === 'cancelled') {
      const Event = this.constructor.model('Event');
      await Event.findByIdAndUpdate(this.event, { $inc: { registrationCount: 1 } });
    }
  }
  
  next();
});

// Store previous status before saving
EventRegistrationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this._previousStatus = this.status;
  }
  next();
});

// Handle registration deletion
EventRegistrationSchema.pre('remove', async function(next) {
  // Only decrement if the registration was confirmed
  if (this.status === 'confirmed') {
    const Event = this.constructor.model('Event');
    await Event.findByIdAndUpdate(this.event, { $inc: { registrationCount: -1 } });
  }
  next();
});

// Static method to get registration stats for an event
EventRegistrationSchema.statics.getRegistrationStats = async function(eventId) {
  const stats = await this.aggregate([
    {
      $match: { event: mongoose.Types.ObjectId(eventId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPaid: { 
          $sum: {
            $cond: [{ $eq: ['$payment.status', 'completed'] }, '$payment.amount', 0]
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        totalPaid: { $sum: '$totalPaid' },
        byStatus: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);

  // Format the result
  const result = {
    total: 0,
    totalPaid: 0,
    byStatus: {}
  };

  if (stats.length > 0) {
    result.total = stats[0].total;
    result.totalPaid = stats[0].totalPaid;
    
    // Convert array to object with status as key
    stats[0].byStatus.forEach(item => {
      result.byStatus[item.status] = item.count;
    });
  }

  return result;
};

// Method to check if a user is registered for an event
EventRegistrationSchema.statics.isUserRegistered = async function(eventId, userId) {
  const registration = await this.findOne({
    event: eventId,
    user: userId,
    status: { $ne: 'cancelled' }
  });
  
  return !!registration;
};

// Virtual for event details
EventRegistrationSchema.virtual('eventDetails', {
  ref: 'Event',
  localField: 'event',
  foreignField: '_id',
  justOne: true
});

// Virtual for user details
EventRegistrationSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Add text index for search
EventRegistrationSchema.index({
  'userDetails.name': 'text',
  'userDetails.email': 'text',
  'payment.transactionId': 'text',
  'customFields.value': 'text'
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
