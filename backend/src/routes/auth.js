const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Create user
    const user = await User.createUser({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      phone: phone?.trim() || '',
      isActor: false
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ User registered successfully: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActor: user.isActor,
        availableTimeslots: user.availableTimeslots,
        scenes: user.scenes
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ 
        error: 'An account with this email already exists' 
      });
    }

    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ 
        error: 'An account with this email already exists' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to register user. Please try again.' 
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ User logged in successfully: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActor: user.isActor,
        availableTimeslots: user.availableTimeslots,
        scenes: user.scenes
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login. Please try again.' 
    });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isActor: user.isActor,
      availableTimeslots: user.availableTimeslots,
      scenes: user.scenes
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Update profile endpoint
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, isActor, availableTimeslots, scenes } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (isActor !== undefined) updates.isActor = isActor;
    if (availableTimeslots !== undefined) updates.availableTimeslots = availableTimeslots;
    if (scenes !== undefined) updates.scenes = scenes;

    const user = await User.updateUser(req.user.userId, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Profile updated for user: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActor: user.isActor,
        availableTimeslots: user.availableTimeslots,
        scenes: user.scenes
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
