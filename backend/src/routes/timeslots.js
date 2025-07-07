const express = require('express');
const Timeslot = require('../models/Timeslot');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all timeslots (global - available to everyone)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all timeslots, not user-specific ones, as timeslots should be global
    const timeslots = await Timeslot.getAllGlobal();
    console.log(`📅 Returning ${timeslots.length} global timeslots to user: ${req.user?.email || req.userId}`);
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

// Get all timeslots with creator info (admin only)
router.get('/admin/with-creators', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const timeslots = await Timeslot.find({})
      .populate('createdBy', 'name email')
      .sort({ day: 1, startTime: 1 });
    console.log(`📅 Admin: Returning ${timeslots.length} timeslots with creator info`);
    res.json(timeslots);
  } catch (error) {
    console.error('Error fetching timeslots with creators:', error);
    res.status(500).json({ error: 'Failed to fetch timeslots' });
  }
});

// Update timeslot (admin can update any, users can update their own)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, day, startTime, endTime, description } = req.body;
    
    if (!label || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Label, day, start time, and end time are required' });
    }

    // Check if user is admin or creator of the timeslot
    const query = req.user.isAdmin ? { _id: id } : { _id: id, createdBy: req.userId };
    
    const timeslot = await Timeslot.findOneAndUpdate(
      query,
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
      return res.status(404).json({ error: 'Timeslot not found or access denied' });
    }
    
    console.log(`📅 Updated timeslot ${id} by ${req.user.isAdmin ? 'admin' : 'user'}: ${req.user.email}`);
    res.json(timeslot);
  } catch (error) {
    console.error('Error updating timeslot:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
});

// Delete timeslot (admin can delete any, users can delete their own)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin or creator of the timeslot
    const query = req.user.isAdmin ? { _id: id } : { _id: id, createdBy: req.userId };
    
    const timeslot = await Timeslot.findOneAndDelete(query);
    
    if (!timeslot) {
      return res.status(404).json({ error: 'Timeslot not found or access denied' });
    }
    
    console.log(`📅 Deleted timeslot ${id} by ${req.user.isAdmin ? 'admin' : 'user'}: ${req.user.email}`);
    res.json({ message: 'Timeslot deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeslot:', error);
    res.status(500).json({ error: 'Failed to delete timeslot' });
  }
});

module.exports = router;
