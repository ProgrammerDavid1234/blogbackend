const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'publisher', 'admin'],
    default: 'user'
  },
  profileImage: {
    type: String,
    default: 'default.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  social: {
    twitter: {
      type: String,
      match: [
        /https?:\/\/(www\.)?twitter\.com\/[A-Za-z0-9_]+/,
        'Please add a valid Twitter URL'
      ]
    },
    facebook: {
      type: String,
      match: [
        /https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9\.]+/,
        'Please add a valid Facebook URL'
      ]
    },
    

    linkedin: {
      type: String,
      match: [
        /https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-]+/,
        'Please add a valid LinkedIn URL'
      ]
    },
    instagram: {
      type: String,
      match: [
        /https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_\.]+/,
        'Please add a valid Instagram URL'
      ]
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  twoFactorCode: String,
  twoFactorExpire: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: Date,
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Generate two-factor authentication code
UserSchema.methods.generateTwoFactorCode = function() {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash code and set to twoFactorCode field
  this.twoFactorCode = code; // In production, hash this
  
  // Set expire (10 minutes)
  this.twoFactorExpire = Date.now() + 10 * 60 * 1000;
  
  return code;
};

// Check if account is locked
UserSchema.methods.isAccountLocked = function() {
  return this.isLocked && this.lockUntil > Date.now();
};

// Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, reset the lock
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment login attempts
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = {
      isLocked: true,
      lockUntil: Date.now() + 30 * 60 * 1000 // Lock for 30 minutes
    };
  }
  
  return await this.updateOne(updates);
};

// Reset login attempts on successful login
UserSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { lastLogin: Date.now() },
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $inc: { __v: 1 } // Increment version to prevent conflicts
  });
};

// Virtual for user's posts
UserSchema.virtual('posts', {
  ref: 'Post', // The model to use
  localField: '_id', // Find posts where `localField`
  foreignField: 'author', // is equal to `foreignField`
  justOne: false // Get an array of posts, not just one
});

// Virtual for user's events
UserSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'organizer',
  justOne: false
});

// Virtual for user's comments
UserSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Cascade delete posts when a user is deleted
UserSchema.pre('remove', async function(next) {
  await this.model('Post').deleteMany({ author: this._id });
  await this.model('Comment').deleteMany({ user: this._id });
  next();
});

module.exports = mongoose.model('User', UserSchema);
