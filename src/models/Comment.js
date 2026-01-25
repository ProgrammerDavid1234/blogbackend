const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please add a comment'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'spam', 'trash'],
    default: 'pending'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  userAgent: String,
  ipAddress: String,
  metadata: {
    isAdmin: {
      type: Boolean,
      default: false
    },
    userRole: String,
    browser: String,
    os: String,
    device: String
  },
  flagged: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    reason: String,
    flaggedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate comments from the same user on the same post
CommentSchema.index({ post: 1, user: 1, content: 1 }, { unique: true });

// Add text index for search
CommentSchema.index({ content: 'text' });

// Virtual for replies
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

// Virtual for user details
CommentSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual for post details
CommentSchema.virtual('postDetails', {
  ref: 'Post',
  localField: 'post',
  foreignField: '_id',
  justOne: true
});

// Static method to get comment count for a post
CommentSchema.statics.getCommentCount = async function(postId) {
  const count = await this.countDocuments({
    post: postId,
    status: 'approved',
    parent: null // Only count top-level comments
  });
  
  // Update the post's comment count
  await this.model('Post').findByIdAndUpdate(postId, {
    commentCount: count
  });
  
  return count;
};

// Calculate likes count
CommentSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Calculate dislikes count
CommentSchema.virtual('dislikesCount').get(function() {
  return this.dislikes ? this.dislikes.length : 0;
});

// Calculate replies count
CommentSchema.virtual('repliesCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Check if a user has liked the comment
CommentSchema.methods.hasLiked = function(userId) {
  return this.likes.some(like => like.equals(userId));
};

// Check if a user has disliked the comment
CommentSchema.methods.hasDisliked = function(userId) {
  return this.dislikes.some(dislike => dislike.equals(userId));
};

// Handle comment deletion
CommentSchema.pre('remove', async function(next) {
  // Remove all replies when a comment is deleted
  await this.model('Comment').deleteMany({ parent: this._id });
  
  // Update comment count for the post if this is a top-level comment
  if (!this.parent) {
    await this.constructor.getCommentCount(this.post);
  }
  
  next();
});

// Update comment count when a comment is saved
CommentSchema.post('save', async function(doc) {
  if (!doc.parent) {
    await doc.constructor.getCommentCount(doc.post);
  }
});

// Add a method to toggle like/dislike
CommentSchema.methods.toggleLike = async function(userId) {
  const hasLiked = this.likes.includes(userId);
  const hasDisliked = this.dislikes.includes(userId);
  
  if (hasLiked) {
    // Remove like
    this.likes.pull(userId);
  } else {
    // Add like and remove dislike if exists
    this.likes.addToSet(userId);
    if (hasDisliked) {
      this.dislikes.pull(userId);
    }
  }
  
  await this.save();
  return { likes: this.likes.length, dislikes: this.dislikes.length };
};

// Add a method to toggle dislike
CommentSchema.methods.toggleDislike = async function(userId) {
  const hasDisliked = this.dislikes.includes(userId);
  const hasLiked = this.likes.includes(userId);
  
  if (hasDisliked) {
    // Remove dislike
    this.dislikes.pull(userId);
  } else {
    // Add dislike and remove like if exists
    this.dislikes.addToSet(userId);
    if (hasLiked) {
      this.likes.pull(userId);
    }
  }
  
  await this.save();
  return { likes: this.likes.length, dislikes: this.dislikes.length };
};

// Add a method to report a comment
CommentSchema.methods.report = async function(userId, reason) {
  // Check if the user has already reported this comment
  const alreadyReported = this.reportedBy.some(
    report => report.user.toString() === userId.toString()
  );
  
  if (!alreadyReported) {
    this.reportedBy.push({
      user: userId,
      reason: reason || 'Inappropriate content'
    });
    
    // If multiple users report, mark as flagged
    if (this.reportedBy.length >= 3 && !this.flagged.isFlagged) {
      this.flagged = {
        isFlagged: true,
        reason: 'Multiple user reports',
        flaggedAt: Date.now()
      };
    }
    
    await this.save();
  }
  
  return this;
};

module.exports = mongoose.model('Comment', CommentSchema);
