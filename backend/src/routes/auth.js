const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      name,
      phone: phone || null,
      is_actor: false
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActor: user.is_actor,
        availableTimeslots: [],
        scenes: []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user with timeslots and scenes
    const userWithDetails = await User.getUserWithTimeslotsAndScenes(user.id);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userWithDetails.id,
        email: userWithDetails.email,
        name: userWithDetails.name,
        phone: userWithDetails.phone,
        isActor: userWithDetails.is_actor,
        availableTimeslots: userWithDetails.availableTimeslots || [],
        scenes: userWithDetails.scenes || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userWithDetails = await User.getUserWithTimeslotsAndScenes(req.user.id);
    
    res.json({
      id: userWithDetails.id,
      email: userWithDetails.email,
      name: userWithDetails.name,
      phone: userWithDetails.phone,
      isActor: userWithDetails.is_actor,
      availableTimeslots: userWithDetails.availableTimeslots || [],
      scenes: userWithDetails.scenes || []
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, isActor, availableTimeslots, scenes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Update user basic info
    await User.update(req.user.id, {
      name,
      phone: phone || null,
      is_actor: isActor
    });

    // Update timeslots and scenes if user is an actor
    if (isActor) {
      await User.updateTimeslots(req.user.id, availableTimeslots || []);
      await User.updateScenes(req.user.id, scenes || []);
    } else {
      // Clear timeslots and scenes if no longer an actor
      await User.updateTimeslots(req.user.id, []);
      await User.updateScenes(req.user.id, []);
    }

    // Get updated user with details
    const userWithDetails = await User.getUserWithTimeslotsAndScenes(req.user.id);

    res.json({
      id: userWithDetails.id,
      email: userWithDetails.email,
      name: userWithDetails.name,
      phone: userWithDetails.phone,
      isActor: userWithDetails.is_actor,
      availableTimeslots: userWithDetails.availableTimeslots || [],
      scenes: userWithDetails.scenes || []
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
