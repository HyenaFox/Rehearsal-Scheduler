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
  },
  // Reference to the user who created this scene (optional for global scenes)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for faster lookups
sceneSchema.index({ title: 1 });
sceneSchema.index({ createdBy: 1 });
sceneSchema.index({ priority: -1 }); // Higher priority first

// Static method to get all scenes (global access)
sceneSchema.statics.getAllScenes = async function() {
  return this.find({}).sort({ priority: -1, title: 1 });
};

// Static method to create scene (global scenes)
sceneSchema.statics.createScene = async function(sceneData, userId = null) {
  const scene = new this({
    ...sceneData,
    createdBy: userId // Optional - can be null for global scenes
  });
  return scene.save();
};

// Prevent OverwriteModelError by checking if model already exists
const Scene = mongoose.models.Scene || mongoose.model('Scene', sceneSchema);

module.exports = Scene;
