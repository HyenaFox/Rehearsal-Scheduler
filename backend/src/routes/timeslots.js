const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Simple in-memory storage for now - replace with database later
let timeslots = [];
let nextTimeslotId = 1;

// Get all timeslots
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json(timeslots);
  } catch (error) {
    console.error('Get timeslots error:', error);
    res.status(500).json({ error: 'Failed to get timeslots' });
  }
});

// Create a new timeslot
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { label, day, startTime, endTime } = req.body;
    
    if (!label || !day || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'label, day, startTime, and endTime are required' 
      });
    }
    
    const timeslot = {
      id: `timeslot-${nextTimeslotId++}`,
      label,
      day,
      startTime,
      endTime,
      createdAt: new Date().toISOString()
    };
    
    timeslots.push(timeslot);
    res.status(201).json(timeslot);
  } catch (error) {
    console.error('Create timeslot error:', error);
    res.status(500).json({ error: 'Failed to create timeslot' });
  }
});

// Update a timeslot
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, day, startTime, endTime } = req.body;
    
    const timeslotIndex = timeslots.findIndex(t => t.id === id);
    if (timeslotIndex === -1) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    timeslots[timeslotIndex] = {
      ...timeslots[timeslotIndex],
      label,
      day,
      startTime,
      endTime,
      updatedAt: new Date().toISOString()
    };
    
    res.json(timeslots[timeslotIndex]);
  } catch (error) {
    console.error('Update timeslot error:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
});

// Delete a timeslot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const timeslotIndex = timeslots.findIndex(t => t.id === id);
    if (timeslotIndex === -1) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    timeslots.splice(timeslotIndex, 1);
    res.json({ message: 'Timeslot deleted successfully' });
  } catch (error) {
    console.error('Delete timeslot error:', error);
    res.status(500).json({ error: 'Failed to delete timeslot' });
  }
});

module.exports = router;
