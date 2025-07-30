const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get all polls (admin) or polls for current user (actor)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    let polls;
    
    if (user.isAdmin) {
      // Admin can see all polls
      polls = await Poll.getAllPolls();
    } else {
      // Actors see polls they're targeted for
      polls = await Poll.getPollsForActor(user._id);
    }
    
    res.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ 
      error: 'Failed to fetch polls',
      details: error.message 
    });
  }
});

// Get a specific poll by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('scheduledRehearsal');
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if user has access to this poll
    const { user } = req;
    const isTargetActor = poll.targetActors.some(target => 
      target.actorId.toString() === user._id.toString()
    );
    
    if (!user.isAdmin && !isTargetActor && poll.createdBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ 
      error: 'Failed to fetch poll',
      details: error.message 
    });
  }
});

// Create a new poll (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can create polls' });
    }
    
    const {
      title,
      description,
      timeSlots,  // Legacy format
      dateRanges, // New format
      scenes,
      targetActorIds,
      settings
    } = req.body;
    
    // Debug logging
    console.log('🗳️ [Backend] Poll creation request:', {
      hasTitle: !!title,
      hasTimeSlots: !!timeSlots,
      hasDateRanges: !!dateRanges,
      hasTargetActorIds: !!targetActorIds,
      dateRangesCount: dateRanges?.length,
      timeSlotsCount: timeSlots?.length
    });
    
    // Validate required fields - accept either timeSlots or dateRanges
    if (!title) {
      return res.status(400).json({ 
        error: 'Missing required field: title is required' 
      });
    }
    
    if (!targetActorIds || !Array.isArray(targetActorIds) || targetActorIds.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required field: targetActorIds must be a non-empty array' 
      });
    }
    
    if (!timeSlots && !dateRanges) {
      return res.status(400).json({ 
        error: 'Missing required field: either timeSlots or dateRanges is required' 
      });
    }
    
    if (dateRanges && (!Array.isArray(dateRanges) || dateRanges.length === 0)) {
      return res.status(400).json({ 
        error: 'dateRanges must be a non-empty array when provided' 
      });
    }
    
    if (timeSlots && (!Array.isArray(timeSlots) || timeSlots.length === 0)) {
      return res.status(400).json({ 
        error: 'timeSlots must be a non-empty array when provided' 
      });
    }
    
    // Get target actors data
    const targetActorsData = await User.find({ 
      _id: { $in: targetActorIds },
      isActor: true 
    }).select('name email');
    
    if (targetActorsData.length !== targetActorIds.length) {
      return res.status(400).json({ 
        error: 'Some target actors not found or not valid actors' 
      });
    }
    
    // Handle dual format support - store both for maximum compatibility
    let pollTimeData = {};
    
    if (dateRanges && dateRanges.length > 0) {
      // New format: dateRanges (preferred)
      const formattedDateRanges = dateRanges.map((range, index) => ({
        id: range.id || `range-${Date.now()}-${index}`,
        date: range.date,
        earliestTime: range.earliestTime,
        latestTime: range.latestTime,
        suggestedDuration: range.suggestedDuration || 120,
        description: range.description || ''
      }));
      pollTimeData.dateRanges = formattedDateRanges;
      
      // Also create compatible timeSlots for legacy components
      const compatibleTimeSlots = formattedDateRanges.map((range, index) => ({
        id: range.id,
        date: range.date,
        startTime: range.earliestTime,
        endTime: range.latestTime,
        description: range.description || ''
      }));
      pollTimeData.timeSlots = compatibleTimeSlots;
      
      console.log('🗳️ [Backend] Using dateRanges format with legacy compatibility');
    } else if (timeSlots && timeSlots.length > 0) {
      // Legacy format: timeSlots only
      const formattedTimeSlots = timeSlots.map((slot, index) => ({
        id: slot.id || `slot-${Date.now()}-${index}`,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        description: slot.description || ''
      }));
      pollTimeData.timeSlots = formattedTimeSlots;
      
      console.log('🗳️ [Backend] Using legacy timeSlots format only');
    }
    
    // Format target actors
    const formattedTargetActors = targetActorsData.map(actor => ({
      actorId: actor._id,
      actorName: actor.name,
      isRequired: true // Default to required, can be modified later
    }));
    
    const pollData = {
      title,
      description: description || '',
      createdBy: user._id,
      createdByName: user.name,
      ...pollTimeData, // Contains either timeSlots or dateRanges
      scenes: scenes || [],
      targetActors: formattedTargetActors,
      settings: {
        allowMultipleSelections: true,
        requireAllActors: true,
        showResponsesPublically: true,
        allowComments: true,
        deadline: null,
        timezone: 'UTC',
        ...settings
      },
      status: 'active'
    };
    
    const poll = await Poll.createPoll(pollData);
    res.status(201).json(poll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ 
      error: 'Failed to create poll',
      details: error.message 
    });
  }
});

// Update a poll (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can update polls' });
    }
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Update poll fields
    const allowedUpdates = ['title', 'description', 'timeSlots', 'scenes', 'settings', 'status'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    Object.assign(poll, updates);
    const updatedPoll = await poll.save();
    
    // Update summary if responses exist
    if (poll.responses.length > 0) {
      await poll.updateSummary();
    }
    
    res.json(updatedPoll);
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({ 
      error: 'Failed to update poll',
      details: error.message 
    });
  }
});

// Submit response to a poll (supports both old timeSlot and new dateRange format)
router.post('/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { timeSlotId, dateRangeId, availabilityBlocks, responseType, comment } = req.body;
    
    // Support both old timeSlot format and new dateRange format
    if ((!timeSlotId && !dateRangeId) || (!responseType && !availabilityBlocks)) {
      return res.status(400).json({ 
        error: 'Missing required fields: (timeSlotId or dateRangeId) and (responseType or availabilityBlocks) are required' 
      });
    }
    
    if (!['available', 'if-needed', 'not-available'].includes(responseType)) {
      return res.status(400).json({ 
        error: 'Invalid responseType. Must be: available, if-needed, or not-available' 
      });
    }
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if user is a target actor for this poll
    const isTargetActor = poll.targetActors.some(target => 
      target.actorId.toString() === user._id.toString()
    );
    
    if (!isTargetActor) {
      return res.status(403).json({ error: 'You are not a target actor for this poll' });
    }
    
    // Check if poll is still active
    if (poll.status !== 'active') {
      return res.status(400).json({ error: 'Poll is not active' });
    }
    
    // Check deadline
    if (poll.settings.deadline && new Date() > poll.settings.deadline) {
      return res.status(400).json({ error: 'Poll deadline has passed' });
    }
    
    let responseData;
    
    if (dateRangeId && availabilityBlocks) {
      // New dateRange format with availability blocks
      const dateRangeExists = poll.dateRanges?.some(range => range.id === dateRangeId);
      if (!dateRangeExists) {
        return res.status(400).json({ error: 'Invalid date range ID' });
      }
      
      responseData = {
        actorId: user._id,
        actorName: user.name,
        dateRangeId,
        availabilityBlocks,
        comment: comment || ''
      };
      
      const updatedPoll = await Poll.updateAvailability(poll._id, responseData);
      res.json(updatedPoll);
    } else if (timeSlotId && responseType) {
      // Legacy timeSlot format
      const timeSlotExists = poll.timeSlots?.some(slot => slot.id === timeSlotId);
      if (!timeSlotExists) {
        return res.status(400).json({ error: 'Invalid time slot ID' });
      }
      
      responseData = {
        actorId: user._id,
        actorName: user.name,
        timeSlotId,
        responseType,
        comment: comment || ''
      };
      
      const updatedPoll = await Poll.addResponse(poll._id, responseData);
      res.json(updatedPoll);
    } else {
      return res.status(400).json({ 
        error: 'Invalid request format. Provide either (timeSlotId + responseType) or (dateRangeId + availabilityBlocks)' 
      });
    }
  } catch (error) {
    console.error('Error submitting poll response:', error);
    res.status(500).json({ 
      error: 'Failed to submit response',
      details: error.message 
    });
  }
});

// Get poll responses summary
router.get('/:id/summary', authenticateToken, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check access permissions
    const { user } = req;
    const isTargetActor = poll.targetActors.some(target => 
      target.actorId.toString() === user._id.toString()
    );
    
    if (!user.isAdmin && !isTargetActor && poll.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update summary before returning
    await poll.updateSummary();
    
    const summary = {
      pollId: poll._id,
      title: poll.title,
      totalTargetActors: poll.targetActors.length,
      totalResponses: poll.summary.totalResponses,
      uniqueResponders: poll.uniqueRespondersCount,
      responseRate: poll.summary.responseRate,
      optimalTimeSlots: poll.summary.optimalTimeSlots,
      timeSlotDetails: poll.timeSlots.map(slot => {
        const responses = poll.getResponsesForTimeSlot(slot.id);
        return {
          timeSlot: slot,
          responses: poll.settings.showResponsesPublically || user.isAdmin ? responses : responses.length,
          availableCount: responses.filter(r => r.responseType === 'available').length,
          ifNeededCount: responses.filter(r => r.responseType === 'if-needed').length,
          notAvailableCount: responses.filter(r => r.responseType === 'not-available').length
        };
      })
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching poll summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch poll summary',
      details: error.message 
    });
  }
});

// Duplicate a poll (admin only)
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can duplicate polls' });
    }
    
    const modifications = req.body || {};
    const duplicatedPoll = await Poll.duplicatePoll(req.params.id, user, modifications);
    
    res.status(201).json(duplicatedPoll);
  } catch (error) {
    console.error('Error duplicating poll:', error);
    res.status(500).json({ 
      error: 'Failed to duplicate poll',
      details: error.message 
    });
  }
});

// Delete a poll (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can delete polls' });
    }
    
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ 
      error: 'Failed to delete poll',
      details: error.message 
    });
  }
});

// Export poll responses as CSV (admin only)
router.get('/:id/export', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Only administrators can export poll data' });
    }
    
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Generate CSV data
    const csvRows = [];
    
    // Header row
    csvRows.push([
      'Poll Title',
      'Actor Name',
      'Time Slot',
      'Date',
      'Start Time',
      'End Time',
      'Response',
      'Comment',
      'Responded At'
    ]);
    
    // Data rows
    poll.responses.forEach(response => {
      const timeSlot = poll.timeSlots.find(slot => slot.id === response.timeSlotId);
      if (timeSlot) {
        csvRows.push([
          poll.title,
          response.actorName,
          timeSlot.description || `${timeSlot.date} ${timeSlot.startTime}-${timeSlot.endTime}`,
          timeSlot.date,
          timeSlot.startTime,
          timeSlot.endTime,
          response.responseType,
          response.comment || '',
          response.respondedAt.toISOString()
        ]);
      }
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="poll-${poll._id}-responses.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting poll:', error);
    res.status(500).json({ 
      error: 'Failed to export poll',
      details: error.message 
    });
  }
});

module.exports = router;