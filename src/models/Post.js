const mongoose = require('mongoose');
const slugify = require('slugify');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: String,
  excerpt: {
    type: String,
    required: [true, 'Please add an excerpt'],
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'Academic',
      'Tech',
      'Social',
      'Cloud',
      'AI',
      'Events',
      'Announcements',
      'Tutorials',
      'News',
      'General'
    ]
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 10; // Limit to 10 tags per post
      },
      message: 'Cannot have more than 10 tags'
    }
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  readTime: {
    type: Number, // in minutes
    default: 0
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  publishedAt: Date,
  lastEditedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create post slug from title
PostSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Set publishedAt when post is first published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  // Update lastEditedAt on any change
  if (this.isModified() && !this.isNew) {
    this.lastEditedAt = Date.now();
  }
  
  // Calculate read time (average reading speed: 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  
  next();
});

// Cascade delete comments when a post is deleted
PostSchema.pre('remove', async function(next) {
  await this.model('Comment').deleteMany({ post: this._id });
  next();
});

// Virtual for comments
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

// Create a text index for search
PostSchema.index({
  title: 'text',
  excerpt: 'text',
  content: 'text',
  tags: 'text'
});

// Static method to get average of post view counts by author
PostSchema.statics.getAverageViewCount = async function(authorId) {
  const obj = await this.aggregate([
    {
      $match: { author: authorId }
    },
    {
      $group: {
        _id: '$author',
        averageViewCount: { $avg: '$viewCount' }
      }
    }
  ]);

  try {
    await this.model('User').findByIdAndUpdate(authorId, {
      averageViewCount: Math.ceil(obj[0].averageViewCount || 0)
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageViewCount after save
PostSchema.post('save', function() {
  this.constructor.getAverageViewCount(this.author);
});

// Call getAverageViewCount before remove
PostSchema.pre('remove', function() {
  this.constructor.getAverageViewCount(this.author);
});

// Method to increment view count
PostSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

module.exports = mongoose.model('Post', PostSchema);
