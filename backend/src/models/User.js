const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  isActor: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  availableTimeslots: [{
    type: String
  }],
  scenes: [{
    type: String
  }],
  // Google Calendar integration fields
  googleCalendarTokens: {
    type: Object,
    default: null
  },
  googleTokens: {
    type: Object,
    default: null
  },
  googleConnected: {
    type: Boolean,
    default: false
  },
  googleEmail: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    default: null
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password_hash')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password_hash, 12);
    this.password_hash = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

// Static method to create user
userSchema.statics.createUser = async function(userData) {
  const { email, password, name, phone, isActor, googleId } = userData;
  
  // Check if user already exists
  const existingUser = await this.findByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  const userDoc = {
    email,
    name,
    phone: phone || '',
    isActor: isActor || false,
    availableTimeslots: [],
    scenes: []
  };

  // Add password hash for regular users
  if (password) {
    userDoc.password_hash = password; // Will be hashed by pre-save hook
  } else if (googleId) {
    // For Google users, create a random password hash to satisfy schema requirements
    userDoc.password_hash = Math.random().toString(36).substring(2);
    userDoc.googleId = googleId;
  } else {
    throw new Error('Either password or googleId must be provided');
  }
  
  const user = new this(userDoc);
  return user.save();
};

// Static method to update user
userSchema.statics.updateUser = async function(id, updates) {
  return this.findByIdAndUpdate(
    id, 
    { 
      ...updates,
      updatedAt: new Date()
    }, 
    { 
      new: true, // Return the updated document
      runValidators: true // Run schema validations
    }
  );
};

// Static method to update an actor
userSchema.statics.updateActor = async function(actorId, actorData) {
  // Ensure that any user being updated as an actor has the isActor flag set
  const updateData = {
    ...actorData,
    isActor: true,
  };
  
  return this.findByIdAndUpdate(actorId, updateData, { new: true });
};

// Static method to get all actors
userSchema.statics.getAllActors = function() {
  return this.find({ isActor: true });
};

// Static method to create actor
userSchema.statics.createActor = async function(actorData) {
  const { name, availableTimeslots, scenes } = actorData;
  
  // Create new actor (standalone actor not tied to user accounts)
  // MongoDB will generate its own ObjectId for _id
  const actor = new this({
    email: `actor-${Date.now()}@rehearsal-scheduler.local`, // Temporary email for standalone actors
    password_hash: 'temp-password', // Temporary password for standalone actors
    name,
    isActor: true,
    availableTimeslots: availableTimeslots || [],
    scenes: scenes || []
  });
  
  return actor.save();
};

// Static method to validate ObjectId
userSchema.statics.isValidObjectId = function(id) {
  return mongoose.Types.ObjectId.isValid(id);
};

// Static method to delete actor
userSchema.statics.deleteActor = async function(id) {
  // First check if this is a real user account
  const user = await this.findById(id);
  if (user && user.email && !user.email.includes('@rehearsal-scheduler.local')) {
    // This is a real user account, just set isActor to false
    user.isActor = false;
    user.availableTimeslots = [];
    user.scenes = [];
    return user.save();
  } else {
    // This is a standalone actor, delete it completely
    return this.findByIdAndDelete(id);
  }
};

// Transform JSON output (remove sensitive data)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password_hash;
  delete user.__v;
  return user;
};

// Prevent OverwriteModelError by checking if model already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
