const mongoose = require('mongoose');
const slugify = require('slugify');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  shortDescription: {
    type: String,
    required: [true, 'Please add a short description'],
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  time: {
    startTime: {
      type: String,
      required: [true, 'Please add a start time']
    },
    endTime: {
      type: String,
      required: [true, 'Please add an end time']
    }
  },
  location: {
    venue: {
      type: String,
      required: [true, 'Please add a venue']
    },
    address: {
      street: String,
      city: {
        type: String,
        required: [true, 'Please add a city']
      },
      state: {
        type: String,
        required: [true, 'Please add a state']
      },
      country: {
        type: String,
        required: [true, 'Please add a country']
      },
      zipCode: String,
      coordinates: {
        // GeoJSON Point
        type: {
          type: String,
          enum: ['Point']
        },
        coordinates: {
          type: [Number],
          index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
      }
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    onlineLink: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.location.isOnline) {
            return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(v);
          }
          return true;
        },
        message: props => `${props.value} is not a valid URL!`
      }
    }
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  gallery: [{
    url: String,
    caption: String,
    isFeatured: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'Workshop',
      'Seminar',
      'Conference',
      'Webinar',
      'Hackathon',
      'Meetup',
      'Networking',
      'Exhibition',
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  organizer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  speakers: [{
    name: {
      type: String,
      required: [true, 'Please add speaker name']
    },
    title: String,
    company: String,
    bio: String,
    photo: String,
    social: {
      twitter: String,
      linkedin: String,
      website: String
    }
  }],
  sponsors: [{
    name: {
      type: String,
      required: [true, 'Please add sponsor name']
    },
    logo: String,
    website: String,
    level: {
      type: String,
      enum: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner', 'Other'],
      default: 'Other'
    }
  }],
  schedule: [{
    time: {
      type: String,
      required: [true, 'Please add session time']
    },
    title: {
      type: String,
      required: [true, 'Please add session title']
    },
    description: String,
    speaker: String,
    type: {
      type: String,
      enum: ['Keynote', 'Workshop', 'Panel', 'Break', 'Networking', 'Other'],
      default: 'Other'
    },
    duration: Number, // in minutes
    location: String
  }],
  registration: {
    isRequired: {
      type: Boolean,
      default: true
    },
    deadline: Date,
    maxAttendees: {
      type: Number,
      min: 1
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    registrationLink: String,
    customFields: [{
      name: {
        type: String,
        required: [true, 'Please add field name']
      },
      type: {
        type: String,
        enum: ['text', 'email', 'number', 'select', 'checkbox', 'radio'],
        default: 'text'
      },
      required: {
        type: Boolean,
        default: false
      },
      options: [String] // For select, checkbox, radio
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'postponed', 'completed'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  publishedAt: Date,
  lastEditedAt: Date,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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

// Create event slug from title
EventSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Set publishedAt when event is first published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  // Update lastEditedAt on any change
  if (this.isModified() && !this.isNew) {
    this.lastEditedAt = Date.now();
  }
  
  next();
});

// Cascade delete registrations when an event is deleted
EventSchema.pre('remove', async function(next) {
  await this.model('EventRegistration').deleteMany({ event: this._id });
  next();
});

// Virtual for event registrations
EventSchema.virtual('registrations', {
  ref: 'EventRegistration',
  localField: '_id',
  foreignField: 'event',
  justOne: false
});

// Get upcoming events
EventSchema.statics.getUpcomingEvents = function(limit = 5) {
  return this.find({ 
    status: 'published',
    startDate: { $gte: new Date() }
  })
  .sort({ startDate: 1 })
  .limit(parseInt(limit));
};

// Get past events
EventSchema.statics.getPastEvents = function(limit = 5) {
  return this.find({ 
    status: 'completed',
    endDate: { $lt: new Date() }
  })
  .sort({ startDate: -1 })
  .limit(parseInt(limit));
};

// Check if registration is open
EventSchema.methods.isRegistrationOpen = function() {
  if (!this.registration.isRequired) return true;
  if (this.registration.deadline) {
    return new Date() <= new Date(this.registration.deadline);
  }
  return this.startDate > new Date();
};

// Check if event is full
EventSchema.methods.isFull = function() {
  if (!this.registration.maxAttendees) return false;
  return this.registrationCount >= this.registration.maxAttendees;
};

// Virtual for registration count
EventSchema.virtual('registrationCount', {
  ref: 'EventRegistration',
  localField: '_id',
  foreignField: 'event',
  count: true
});

// Create a text index for search
EventSchema.index({
  title: 'text',
  description: 'text',
  'location.venue': 'text',
  'location.address.city': 'text',
  'location.address.state': 'text',
  'location.address.country': 'text',
  tags: 'text'
});

// Geocoding could be implemented here for address to coordinates conversion
// This would be a pre-save hook that uses a geocoding service

module.exports = mongoose.model('Event', EventSchema);
