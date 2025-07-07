const express = require('express');
const Scene = require('../models/Scene');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all scenes (global - available to everyone)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all scenes, not user-specific ones, as scenes should be global
    const scenes = await Scene.getAllGlobal();
    console.log(`🎬 Returning ${scenes.length} global scenes to user: ${req.user?.email || req.userId}`);
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

// Get all scenes with creator info (admin only)
router.get('/admin/with-creators', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const scenes = await Scene.find({})
      .populate('createdBy', 'name email')
      .sort({ priority: -1, title: 1 });
    console.log(`🎬 Admin: Returning ${scenes.length} scenes with creator info`);
    res.json(scenes);
  } catch (error) {
    console.error('Error fetching scenes with creators:', error);
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

// Update scene (admin can update any, users can update their own)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, actorsRequired, location, duration, priority } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if user is admin or creator of the scene
    const query = req.user.isAdmin ? { _id: id } : { _id: id, createdBy: req.userId };

    const scene = await Scene.findOneAndUpdate(
      query,
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
      return res.status(404).json({ error: 'Scene not found or access denied' });
    }
    
    console.log(`🎬 Updated scene ${id} by ${req.user.isAdmin ? 'admin' : 'user'}: ${req.user.email}`);
    res.json(scene);
  } catch (error) {
    console.error('Error updating scene:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// Delete scene (admin can delete any, users can delete their own)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin or creator of the scene
    const query = req.user.isAdmin ? { _id: id } : { _id: id, createdBy: req.userId };
    
    const scene = await Scene.findOneAndDelete(query);
    
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found or access denied' });
    }
    
    console.log(`🎬 Deleted scene ${id} by ${req.user.isAdmin ? 'admin' : 'user'}: ${req.user.email}`);
    res.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Error deleting scene:', error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

module.exports = router;
