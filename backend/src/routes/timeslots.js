const express = require('express');
const Timeslot = require('../models/Timeslot');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all timeslots - returns pre-populated timeslots
router.get('/', async (req, res) => {
  try {
    // Generate all possible timeslots (pre-populated system)
    // Rehearsals: 5:00 PM - 11:00 PM, excluding Fridays
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];
    
    const generateTimeSlots = () => {
      const slots = [];
      for (let hour = 17; hour <= 22; hour++) { // 5 PM (17) to 10 PM (22)
        for (let minute = 0; minute < 60; minute += 30) {
          const hour12 = hour > 12 ? hour - 12 : hour;
          const period = 'PM';
          const minute12 = minute.toString().padStart(2, '0');
          
          // Skip 11:30 PM to end at 11:00 PM
          if (hour === 22 && minute === 30) continue;
          
          slots.push(`${hour12}:${minute12} ${period}`);
        }
      }
      return slots;
    };
    
    const getNextTimeSlot = (currentTime) => {
      const timeSlots = generateTimeSlots();
      const currentIndex = timeSlots.indexOf(currentTime);
      if (currentIndex === -1 || currentIndex === timeSlots.length - 1) {
        return '11:30 PM'; // End of day
      }
      return timeSlots[currentIndex + 1];
    };
    
    const timeSlots = generateTimeSlots();
    const timeslots = [];
    
    DAYS.forEach(day => {
      timeSlots.forEach(time => {
        timeslots.push({
          id: `${day}_${time}`,
          _id: `${day}_${time}`,
          label: `${day} ${time}`,
          day,
          startTime: time,
          endTime: getNextTimeSlot(time),
          description: `30-minute rehearsal slot on ${day} from ${time}`,
          available: true,
          isPrePopulated: true
        });
      });
    });
    
    res.json(timeslots);
  } catch (error) {
    console.error('Error fetching timeslots:', error);
    res.status(500).json({ error: 'Failed to fetch timeslots' });
  }
});

// Create new timeslot
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { label, day, startTime, endTime, description } = req.body;
    
    if (!label || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Label, day, start time, and end time are required' });
    }

    const timeslot = await Timeslot.createTimeslot({
      label,
      day,
      startTime,
      endTime,
      description: description || ''
    }, req.userId);
    
    res.status(201).json(timeslot);
  } catch (error) {
    console.error('Error creating timeslot:', error);
    res.status(500).json({ error: 'Failed to create timeslot' });
  }
});

// Update timeslot
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, day, startTime, endTime, description } = req.body;
    
    if (!label || !day || !startTime || !endTime) {
      return res.status(400).json({ error: 'Label, day, start time, and end time are required' });
    }

    const timeslot = await Timeslot.findOneAndUpdate(
      { _id: id, createdBy: req.userId },
      {
        label,
        day,
        startTime,
        endTime,
        description: description || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!timeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    res.json(timeslot);
  } catch (error) {
    console.error('Error updating timeslot:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
});

// Delete timeslot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const timeslot = await Timeslot.findOneAndDelete({ _id: id, createdBy: req.userId });
    
    if (!timeslot) {
      return res.status(404).json({ error: 'Timeslot not found' });
    }
    
    res.json({ message: 'Timeslot deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeslot:', error);
    res.status(500).json({ error: 'Failed to delete timeslot' });
  }
});

module.exports = router;
