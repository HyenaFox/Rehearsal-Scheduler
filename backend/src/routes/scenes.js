const express = require('express');
const Scene = require('../models/Scene');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all scenes
router.get('/', async (req, res) => {
  try {
    const scenes = await Scene.getAll();
    res.json(scenes);
  } catch (error) {
    console.error('Error fetching scenes:', error);
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

// Create new scene
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, actorsRequired, location, duration, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const scene = await Scene.createScene({
      title,
      description: description || '',
      actorsRequired: actorsRequired || [],
      location: location || '',
      duration: duration || 60,
      priority: priority || 5
    }, req.userId);
    
    res.status(201).json(scene);
  } catch (error) {
    console.error('Error creating scene:', error);
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

// Update scene
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, actorsRequired, location, duration, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const scene = await Scene.findOneAndUpdate(
      { _id: id, createdBy: req.userId },
      {
        title,
        description: description || '',
        actorsRequired: actorsRequired || [],
        location: location || '',
        duration: duration || 60,
        priority: priority || 5,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    res.json(scene);
  } catch (error) {
    console.error('Error updating scene:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// Delete scene
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const scene = await Scene.findOneAndDelete({ _id: id, createdBy: req.userId });
    
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    res.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Error deleting scene:', error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

module.exports = router;
