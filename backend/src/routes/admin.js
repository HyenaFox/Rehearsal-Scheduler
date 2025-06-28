const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Server error during admin check' });
  }
};

// Create admin user (requires existing admin or no admins exist)
router.post('/create-admin', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Check if user is already admin or if no admins exist
    const requestingUser = await User.findById(req.user.id);
    const existingAdmins = await User.find({ isAdmin: true });
    
    if (existingAdmins.length > 0 && (!requestingUser || !requestingUser.isAdmin)) {
      return res.status(403).json({ error: 'Only existing admins can create new admin accounts' });
    }
    
    const newAdmin = await User.createAdmin({
      email,
      password,
      name,
      phone
    });
    
    console.log('✅ Admin created successfully:', newAdmin.email);
    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        name: newAdmin.name,
        isAdmin: newAdmin.isAdmin
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create admin account' });
    }
  }
});

// Delete actor (admin only)
router.delete('/actors/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedActor = await User.deleteActor(id);
    
    if (!deletedActor) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    console.log('✅ Admin deleted actor:', id);
    res.json({ message: 'Actor deleted successfully' });
  } catch (error) {
    console.error('Admin delete actor error:', error);
    res.status(500).json({ error: 'Failed to delete actor' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email phone isActor isAdmin createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Check if current user is admin
router.get('/check-admin', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ isAdmin: user ? user.isAdmin : false });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

module.exports = router;
