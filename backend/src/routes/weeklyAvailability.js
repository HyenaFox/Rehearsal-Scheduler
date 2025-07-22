const express = require('express');
const WeeklyAvailability = require('../models/WeeklyAvailability');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all weekly availability
router.get('/', authenticateToken, async (req, res) => {
  try {
    const weeklyAvailabilities = await WeeklyAvailability.find();
    res.json(weeklyAvailabilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new weekly availability
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;
  const weeklyAvailability = new WeeklyAvailability({
    dayOfWeek,
    startTime,
    endTime,
  });

  try {
    const newWeeklyAvailability = await weeklyAvailability.save();
    res.status(201).json(newWeeklyAvailability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete weekly availability
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await WeeklyAvailability.findByIdAndDelete(req.params.id);
    res.json({ message: 'Weekly availability deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
