const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  actorsRequired: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  }
}, {
  timestamps: true
});

// Index for faster lookups
sceneSchema.index({ title: 1 });
sceneSchema.index({ priority: -1 }); // Higher priority first

// Static method to get all scenes for a user
sceneSchema.statics.getAllForUser = async function(userId) {
  return this.find({ createdBy: userId }).sort({ priority: -1, title: 1 });
};

// Static method to get all scenes
sceneSchema.statics.getAll = async function() {
  return this.find({}).sort({ priority: -1, title: 1 });
};

// Static method to create scene
sceneSchema.statics.createScene = async function(sceneData) {
  const scene = new this(sceneData);
  return scene.save();
};

// Prevent OverwriteModelError by checking if model already exists
const Scene = mongoose.models.Scene || mongoose.model('Scene', sceneSchema);

module.exports = Scene;
