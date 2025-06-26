const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all actors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const actors = await User.getAllActors();
    res.json(actors);
  } catch (error) {
    console.error('Get actors error:', error);
    res.status(500).json({ error: 'Failed to get actors' });
  }
});

module.exports = router;
