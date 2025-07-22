const mongoose = require('mongoose');

const weeklyAvailabilitySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 for Sunday, 1 for Monday, etc.
    required: true,
  },
  startTime: {
    type: String, // "HH:mm" format
    required: true,
  },
  endTime: {
    type: String, // "HH:mm" format
    required: true,
  },
});

const WeeklyAvailability = mongoose.model('WeeklyAvailability', weeklyAvailabilitySchema);

module.exports = WeeklyAvailability;
