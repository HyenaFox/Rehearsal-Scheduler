const express = require('express');
const Rehearsal = require('../models/Rehearsal');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all rehearsals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rehearsals = await Rehearsal.getAllRehearsals();
    // Transform _id to id for frontend compatibility
    const transformedRehearsals = rehearsals.map(rehearsal => ({
      ...rehearsal.toObject(),
      id: rehearsal._id.toString()
    }));
    res.json(transformedRehearsals);
  } catch (error) {
    console.error('Get rehearsals error:', error);
    res.status(500).json({ error: 'Failed to get rehearsals' });
  }
});

// Create new rehearsal
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, timeslotId, timeslot, actorIds, actors } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!timeslotId || !timeslot) {
      return res.status(400).json({ error: 'Timeslot is required' });
    }
    
    if (!actorIds || !Array.isArray(actorIds) || actorIds.length === 0) {
      return res.status(400).json({ error: 'At least one actor is required' });
    }

    const rehearsalData = {
      title,
      timeslotId,
      timeslot,
      actorIds,
      actors: actors || [],
      createdBy: req.user.id
    };

    const rehearsal = await Rehearsal.createRehearsal(rehearsalData);
    
    // Transform _id to id for frontend compatibility
    const transformedRehearsal = {
      ...rehearsal.toObject(),
      id: rehearsal._id.toString()
    };
    
    res.status(201).json(transformedRehearsal);
  } catch (error) {
    console.error('Create rehearsal error:', error);
    res.status(500).json({ error: 'Failed to create rehearsal' });
  }
});

// Update rehearsal
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, timeslotId, timeslot, actorIds, actors } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!timeslotId || !timeslot) {
      return res.status(400).json({ error: 'Timeslot is required' });
    }
    
    if (!actorIds || !Array.isArray(actorIds) || actorIds.length === 0) {
      return res.status(400).json({ error: 'At least one actor is required' });
    }

    const rehearsalData = {
      title,
      timeslotId,
      timeslot,
      actorIds,
      actors: actors || []
    };

    const updatedRehearsal = await Rehearsal.updateRehearsal(id, rehearsalData);
    
    if (!updatedRehearsal) {
      return res.status(404).json({ error: 'Rehearsal not found' });
    }
    
    // Transform _id to id for frontend compatibility
    const transformedRehearsal = {
      ...updatedRehearsal.toObject(),
      id: updatedRehearsal._id.toString()
    };
    
    res.json(transformedRehearsal);
  } catch (error) {
    console.error('Update rehearsal error:', error);
    res.status(500).json({ error: 'Failed to update rehearsal' });
  }
});

// Delete rehearsal
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Rehearsal.deleteRehearsal(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Rehearsal not found' });
    }
    
    res.json({ message: 'Rehearsal deleted successfully' });
  } catch (error) {
    console.error('Delete rehearsal error:', error);
    res.status(500).json({ error: 'Failed to delete rehearsal' });
  }
});

module.exports = router;
