const express = require('express');
const Timeslot = require('../models/Timeslot');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all timeslots
router.get('/', authenticateToken, async (req, res) => {
  try {
    const timeslots = await Timeslot.getAllForUser(req.userId);
    res.json(timeslots);
  } catch (error) {
    console.error('Error fetching timeslots:', error);
    res.status(500).json({ error: 'Failed to fetch timeslots' });
  }
});

// Create new timeslot
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { label, day, startTime, endTime, description } = req.body;
    
    if (!label || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Label, day, start time, and end time are required' });
    }

    const timeslot = await Timeslot.createTimeslot({
      label,
      day,
      startTime,
      endTime,
      description: description || ''
    }, req.userId);
    
    res.status(201).json(timeslot);
  } catch (error) {
    console.error('Error creating timeslot:', error);
    res.status(500).json({ error: 'Failed to create timeslot' });
  }
});

// Bulk create timeslots
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeslots } = req.body;
    if (!Array.isArray(timeslots) || timeslots.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of timeslots.' });
    }

    const createdTimeslots = await Timeslot.create(timeslots.map(t => ({ ...t, createdBy: req.user.id })));
    res.status(201).json(createdTimeslots);
  } catch (error) {
    console.error('Error bulk creating timeslots:', error);
    res.status(500).json({ error: 'Failed to bulk create timeslots' });
  }
});

// Update timeslot
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, day, startTime, endTime, description } = req.body;
    
    if (!label || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Label, day, start time, and end time are required' });
    }

    const timeslot = await Timeslot.findOneAndUpdate(
      { _id: id, createdBy: req.userId },
      {
        label,
        day,
        startTime,
        endTime,
        description: description || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!timeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    res.json(timeslot);
  } catch (error) {
    console.error('Error updating timeslot:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
});

// Delete timeslot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const timeslot = await Timeslot.findOneAndDelete({ _id: id, createdBy: req.userId });
    
    if (!timeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    res.json({ message: 'Timeslot deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeslot:', error);
    res.status(500).json({ error: 'Failed to delete timeslot' });
  }
});

module.exports = router;
