import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId && !this.twitterId && !this.linkedinId;
    }
  },
  name: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  googleId: String,
  googleAccessToken: String,
  googleRefreshToken: String,
  googleTokenExpiry: Date,
  facebookId: String,
  facebookAccessToken: String,
  facebookRefreshToken: String,
  twitterId: String,
  twitterAccessToken: String,
  twitterTokenSecret: String,
  linkedinId: String,
  linkedinAccessToken: String,
  linkedinRefreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update Google tokens
userSchema.methods.updateGoogleTokens = async function(accessToken, refreshToken, expiryDate) {
  this.googleAccessToken = accessToken;
  if (refreshToken) {
    this.googleRefreshToken = refreshToken;
  }
  this.googleTokenExpiry = expiryDate;
  return this.save();
};

// Method to check if Google token is expired
userSchema.methods.isGoogleTokenExpired = function() {
  return this.googleTokenExpiry && new Date() > this.googleTokenExpiry;
};

// Method to get valid Google access token
userSchema.methods.getValidGoogleAccessToken = async function() {
  if (this.isGoogleTokenExpired()) {
    // Here you would implement token refresh logic using the refresh token
    // For now, we'll just return the current token
    return this.googleAccessToken;
  }
  return this.googleAccessToken;
};

// Method to update LinkedIn tokens
userSchema.methods.updateLinkedInTokens = async function(accessToken, refreshToken) {
  this.linkedinAccessToken = accessToken;
  if (refreshToken) {
    this.linkedinRefreshToken = refreshToken;
  }
  return this.save();
};

// Method to update Twitter tokens
userSchema.methods.updateTwitterTokens = async function(accessToken, tokenSecret) {
  this.twitterAccessToken = accessToken;
  this.twitterTokenSecret = tokenSecret;
  return this.save();
};

// Method to update Facebook tokens
userSchema.methods.updateFacebookTokens = async function(accessToken, refreshToken) {
  this.facebookAccessToken = accessToken;
  if (refreshToken) {
    this.facebookRefreshToken = refreshToken;
  }
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;