const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Reference to the user who created this timeslot
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
timeslotSchema.index({ day: 1, startTime: 1 });
timeslotSchema.index({ createdBy: 1 });

// Static method to get all timeslots for a user
timeslotSchema.statics.getAllForUser = async function(userId) {
  return this.find({ createdBy: userId }).sort({ day: 1, startTime: 1 });
};

// Static method to create timeslot
timeslotSchema.statics.createTimeslot = async function(timeslotData, userId) {
  const timeslot = new this({
    ...timeslotData,
    createdBy: userId
  });
  return timeslot.save();
};

// Prevent OverwriteModelError by checking if model already exists
const Timeslot = mongoose.models.Timeslot || mongoose.model('Timeslot', timeslotSchema);

module.exports = Timeslot;
