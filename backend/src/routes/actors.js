const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all actors
router.get('/', async (req, res) => {
  try {
    const actors = await User.getAllActors();
    // Transform _id to id for frontend compatibility
    const transformedActors = actors.map(actor => ({
      ...actor.toObject(),
      id: actor._id.toString()
    }));
    res.json(transformedActors);
  } catch (error) {
    console.error('Get actors error:', error);
    res.status(500).json({ error: 'Failed to get actors' });
  }
});

// Create new actor
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, availableTimeslots, scenes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Create actor data (no ID - MongoDB will generate one)
    const actorData = {
      name,
      availableTimeslots: availableTimeslots || [],
      scenes: scenes || [],
      isActor: true
    };

    // For now, we'll store this as a temporary solution
    // In a real implementation, you'd save to a dedicated actors collection
    const actor = await User.createActor(actorData);
    
    // Transform _id to id for frontend compatibility
    const transformedActor = {
      ...actor.toObject(),
      id: actor._id.toString()
    };
    
    res.status(201).json(transformedActor);
  } catch (error) {
    console.error('Create actor error:', error);
    res.status(500).json({ error: 'Failed to create actor' });
  }
});

// Update actor
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, availableTimeslots, scenes } = req.body;
    
    console.log('Update actor request - ID:', id, 'Type:', typeof id);
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      console.error('Invalid actor ID:', id);
      return res.status(400).json({ error: 'Invalid actor ID' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const actorData = {
      name,
      availableTimeslots: availableTimeslots || [],
      scenes: scenes || [],
      isActor: true
    };

    const updatedActor = await User.updateActor(id, actorData);
    
    if (!updatedActor) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    // Transform _id to id for frontend compatibility
    const transformedActor = {
      ...updatedActor.toObject(),
      id: updatedActor._id.toString()
    };
    
    res.json(transformedActor);
  } catch (error) {
    console.error('Update actor error:', error);
    res.status(500).json({ error: 'Failed to update actor' });
  }
});

// Delete actor
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await User.deleteActor(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    res.json({ message: 'Actor deleted successfully' });
  } catch (error) {
    console.error('Delete actor error:', error);
    res.status(500).json({ error: 'Failed to delete actor' });
  }
});

module.exports = router;
