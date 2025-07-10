const express = require('express');
const Scene = require('../models/Scene');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all scenes - public access for viewing scenes
router.get('/', async (req, res) => {
  try {
    const scenes = await Scene.getAllScenes();
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

// Update scene - global access for admins
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, actorsRequired, location, duration, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const scene = await Scene.findByIdAndUpdate(
      id,
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

// Delete scene - global access for admins
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const scene = await Scene.findByIdAndDelete(id);
    
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
