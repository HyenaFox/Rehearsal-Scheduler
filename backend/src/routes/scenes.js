const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Simple in-memory storage for now - replace with database later
let scenes = [];
let nextSceneId = 1;

// Get all scenes
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json(scenes);
  } catch (error) {
    console.error('Get scenes error:', error);
    res.status(500).json({ error: 'Failed to get scenes' });
  }
});

// Create a new scene
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        error: 'title is required' 
      });
    }
    
    const scene = {
      id: `scene-${nextSceneId++}`,
      title,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    scenes.push(scene);
    res.status(201).json(scene);
  } catch (error) {
    console.error('Create scene error:', error);
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

// Update a scene
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const sceneIndex = scenes.findIndex(s => s.id === id);
    if (sceneIndex === -1) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    scenes[sceneIndex] = {
      ...scenes[sceneIndex],
      title,
      description,
      updatedAt: new Date().toISOString()
    };
    
    res.json(scenes[sceneIndex]);
  } catch (error) {
    console.error('Update scene error:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// Delete a scene
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sceneIndex = scenes.findIndex(s => s.id === id);
    if (sceneIndex === -1) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    
    scenes.splice(sceneIndex, 1);
    res.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Delete scene error:', error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

module.exports = router;
