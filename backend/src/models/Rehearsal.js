const mongoose = require('mongoose');

const rehearsalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  timeslotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeslot',
    required: true
  },
  timeslot: {
    type: Object, // Store the full timeslot object for easier access
    required: true
  },
  actorIds: [{
    type: String, // User IDs of the actors
    required: true
  }],
  actors: [{
    type: Object, // Store the full actor objects for easier access
    required: true
  }],
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
rehearsalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get all rehearsals
rehearsalSchema.statics.getAllRehearsals = async function() {
  return this.find({})
    .sort({ createdAt: -1 }); // Most recent first
};

// Static method to create rehearsal
rehearsalSchema.statics.createRehearsal = async function(rehearsalData) {
  const rehearsal = new this(rehearsalData);
  return rehearsal.save();
};

// Static method to update rehearsal
rehearsalSchema.statics.updateRehearsal = async function(id, rehearsalData) {
  return this.findByIdAndUpdate(
    id,
    {
      ...rehearsalData,
      updatedAt: new Date()
    },
    {
      new: true, // Return the updated document
      runValidators: true // Run schema validations
    }
  );
};

// Static method to delete rehearsal
rehearsalSchema.statics.deleteRehearsal = async function(id) {
  return this.findByIdAndDelete(id);
};

module.exports = mongoose.model('Rehearsal', rehearsalSchema);
