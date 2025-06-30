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
  }
}, {
  timestamps: true
});

// Index for faster lookups
timeslotSchema.index({ day: 1, startTime: 1 });

// Static method to get all timeslots for a user
timeslotSchema.statics.getAllForUser = async function(userId) {
  return this.find({ createdBy: userId }).sort({ day: 1, startTime: 1 });
};

// Static method to get all timeslots
timeslotSchema.statics.getAll = async function() {
  return this.find({}).sort({ day: 1, startTime: 1 });
};

// Static method to create timeslot
timeslotSchema.statics.createTimeslot = async function(timeslotData) {
  const timeslot = new this(timeslotData);
  return timeslot.save();
};

// Prevent OverwriteModelError by checking if model already exists
const Timeslot = mongoose.models.Timeslot || mongoose.model('Timeslot', timeslotSchema);

module.exports = Timeslot;
