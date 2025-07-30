const mongoose = require('mongoose');

// Individual availability block from an actor (Timeful-style)
const availabilityBlockSchema = new mongoose.Schema({
  startTime: {
    type: String, // HH:MM format
    required: true
  },
  endTime: {
    type: String, // HH:MM format  
    required: true
  },
  responseType: {
    type: String,
    enum: ['available', 'if-needed'],
    required: true,
    default: 'available'
  }
});

// Actor's response for a specific date (contains multiple availability blocks)
const pollResponseSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorName: {
    type: String,
    required: true
  },
  dateRangeId: {
    type: String,
    required: true
  },
  // Array of availability blocks for this date
  availabilityBlocks: [availabilityBlockSchema],
  comment: {
    type: String,
    default: ''
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
});

// Date range for the poll (Timeful-style)
const dateRangeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  // Time range window when people can potentially meet
  earliestTime: {
    type: String, // HH:MM format - earliest possible start time
    required: true
  },
  latestTime: {
    type: String, // HH:MM format - latest possible end time
    required: true
  },
  // Suggested meeting duration (optional)
  suggestedDuration: {
    type: Number, // minutes
    default: 120 // 2 hours default
  },
  description: {
    type: String,
    default: ''
  }
});

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  // Date ranges that participants can mark availability within
  dateRanges: [dateRangeSchema],
  
  // Scenes involved in this poll (for theater-specific context)
  scenes: [{
    type: String,
    trim: true
  }],
  
  // Actors who should respond to this poll
  targetActors: [{
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorName: {
      type: String,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true // Whether this actor is required vs optional
    }
  }],
  
  // All responses from actors
  responses: [pollResponseSchema],
  
  // Poll settings
  settings: {
    allowMultipleSelections: {
      type: Boolean,
      default: true
    },
    requireAllActors: {
      type: Boolean,
      default: true // Whether all actors must attend
    },
    showResponsesPublically: {
      type: Boolean,
      default: true // Whether responses are visible to all or just admin
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    deadline: {
      type: Date,
      default: null // Optional deadline for responses
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Poll status
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'scheduled'],
    default: 'active'
  },
  
  // If a rehearsal was scheduled from this poll
  scheduledRehearsal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rehearsal',
    default: null
  },
  
  // Analytics/summary data (computed)
  summary: {
    totalResponses: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    },
    optimalTimeSlots: [{
      timeSlotId: String,
      availableCount: Number,
      ifNeededCount: Number,
      notAvailableCount: Number,
      totalScore: Number // Weighted score for ranking
    }]
  }
}, {
  timestamps: true
});

// Index for efficient queries
pollSchema.index({ createdBy: 1, status: 1 });
pollSchema.index({ 'targetActors.actorId': 1, status: 1 });
pollSchema.index({ createdAt: -1 });

// Virtual for getting response count
pollSchema.virtual('responseCount').get(function() {
  return this.responses.length;
});

// Virtual for getting unique responders count
pollSchema.virtual('uniqueRespondersCount').get(function() {
  const uniqueActors = new Set(this.responses.map(r => r.actorId.toString()));
  return uniqueActors.size;
});

// Method to get responses for a specific date range
pollSchema.methods.getResponsesForDateRange = function(dateRangeId) {
  return this.responses.filter(response => response.dateRangeId === dateRangeId);
};

// Method to get actor's responses
pollSchema.methods.getActorResponses = function(actorId) {
  return this.responses.filter(response => response.actorId.toString() === actorId.toString());
};

// Method to check if actor has responded
pollSchema.methods.hasActorResponded = function(actorId) {
  return this.responses.some(response => response.actorId.toString() === actorId.toString());
};

// Method to find overlap windows for a date range (Timeful-style)
pollSchema.methods.findOverlapWindows = function(dateRangeId) {
  const responses = this.getResponsesForDateRange(dateRangeId);
  const dateRange = this.dateRanges.find(dr => dr.id === dateRangeId);
  
  if (!dateRange || responses.length === 0) return [];
  
  // Create time slots in 15-minute increments for overlap analysis
  const timeSlots = this.generateTimeSlots(dateRange.earliestTime, dateRange.latestTime, 15);
  const overlapAnalysis = [];
  
  timeSlots.forEach(slot => {
    const availableActors = [];
    const ifNeededActors = [];
    
    responses.forEach(response => {
      response.availabilityBlocks.forEach(block => {
        if (this.timeOverlaps(slot.startTime, slot.endTime, block.startTime, block.endTime)) {
          if (block.responseType === 'available') {
            availableActors.push(response.actorId);
          } else if (block.responseType === 'if-needed') {
            ifNeededActors.push(response.actorId);
          }
        }
      });
    });
    
    if (availableActors.length > 0 || ifNeededActors.length > 0) {
      // Calculate weighted score: available=1.0, if-needed=0.5
      const score = availableActors.length + (ifNeededActors.length * 0.5);
      
      overlapAnalysis.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableActors: [...new Set(availableActors)], // Remove duplicates
        ifNeededActors: [...new Set(ifNeededActors)],
        totalActors: [...new Set([...availableActors, ...ifNeededActors])].length,
        score: score
      });
    }
  });
  
  // Group consecutive time slots with same actors into windows
  const windows = this.groupConsecutiveSlots(overlapAnalysis);
  
  // Sort by score (highest first)
  return windows.sort((a, b) => b.score - a.score);
};

// Helper method to check if two time ranges overlap
pollSchema.methods.timeOverlaps = function(start1, end1, start2, end2) {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  return s1 < e2 && e1 > s2;
};

// Helper method to generate time slots
pollSchema.methods.generateTimeSlots = function(startTime, endTime, intervalMinutes) {
  const slots = [];
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const toTimeString = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
    slots.push({
      startTime: toTimeString(minutes),
      endTime: toTimeString(Math.min(minutes + intervalMinutes, endMinutes))
    });
  }
  
  return slots;
};

// Helper method to group consecutive time slots
pollSchema.methods.groupConsecutiveSlots = function(slots) {
  if (slots.length === 0) return [];
  
  const windows = [];
  let currentWindow = {
    startTime: slots[0].startTime,
    endTime: slots[0].endTime,
    availableActors: slots[0].availableActors,
    ifNeededActors: slots[0].ifNeededActors,
    score: slots[0].score
  };
  
  for (let i = 1; i < slots.length; i++) {
    const slot = slots[i];
    const prevSlot = slots[i - 1];
    
    // Check if actors are the same and times are consecutive
    const sameActors = 
      JSON.stringify(slot.availableActors.sort()) === JSON.stringify(prevSlot.availableActors.sort()) &&
      JSON.stringify(slot.ifNeededActors.sort()) === JSON.stringify(prevSlot.ifNeededActors.sort());
    
    const consecutive = prevSlot.endTime === slot.startTime;
    
    if (sameActors && consecutive) {
      // Extend current window
      currentWindow.endTime = slot.endTime;
      currentWindow.score += slot.score;
    } else {
      // Start new window
      windows.push(currentWindow);
      currentWindow = {
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableActors: slot.availableActors,
        ifNeededActors: slot.ifNeededActors,
        score: slot.score
      };
    }
  }
  
  windows.push(currentWindow);
  return windows;
};

// Method to update poll summary/analytics
pollSchema.methods.updateSummary = function() {
  const totalTargetActors = this.targetActors.length;
  const uniqueResponders = new Set(this.responses.map(r => r.actorId.toString()));
  
  this.summary.totalResponses = this.responses.length;
  this.summary.responseRate = totalTargetActors > 0 ? (uniqueResponders.size / totalTargetActors) * 100 : 0;
  
  // Calculate optimal time ranges with overlap analysis
  const dateRangeSummaries = this.dateRanges.map(dateRange => {
    const rangeResponses = this.getResponsesForDateRange(dateRange.id);
    
    // Find all overlapping time windows
    const overlapWindows = this.findOverlapWindows(dateRange.id);
    
    return {
      dateRangeId: dateRange.id,
      totalResponses: rangeResponses.length,
      respondersCount: rangeResponses.length,
      overlapWindows: overlapWindows.slice(0, 5), // Top 5 overlap windows
      bestOverlap: overlapWindows[0] || null
    };
  });
  
  // Sort by best overlap score
  this.summary.optimalDateRanges = dateRangeSummaries.sort((a, b) => {
    const scoreA = a.bestOverlap ? a.bestOverlap.score : 0;
    const scoreB = b.bestOverlap ? b.bestOverlap.score : 0;
    return scoreB - scoreA;
  });
  
  return this.save();
};

// Static method to create poll
pollSchema.statics.createPoll = async function(pollData) {
  const poll = new this(pollData);
  return poll.save();
};

// Static method to get all polls
pollSchema.statics.getAllPolls = async function(filters = {}) {
  return this.find(filters)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get polls for an actor
pollSchema.statics.getPollsForActor = async function(actorId) {
  return this.find({
    'targetActors.actorId': actorId,
    status: { $in: ['active', 'draft'] }
  })
  .populate('createdBy', 'name email')
  .sort({ createdAt: -1 });
};

// Static method to add/update availability response to poll (Timeful-style)
pollSchema.statics.updateAvailability = async function(pollId, responseData) {
  const poll = await this.findById(pollId);
  if (!poll) {
    throw new Error('Poll not found');
  }
  
  // Remove any existing response from this actor for this date range
  poll.responses = poll.responses.filter(response => 
    !(response.actorId.toString() === responseData.actorId.toString() && 
      response.dateRangeId === responseData.dateRangeId)
  );
  
  // Add the new response with availability blocks
  poll.responses.push(responseData);
  
  // Update summary
  await poll.updateSummary();
  
  return poll;
};

// Static method to duplicate poll
pollSchema.statics.duplicatePoll = async function(pollId, createdBy, modifications = {}) {
  const originalPoll = await this.findById(pollId);
  if (!originalPoll) {
    throw new Error('Poll not found');
  }
  
  const duplicatedData = {
    title: modifications.title || `${originalPoll.title} (Copy)`,
    description: modifications.description || originalPoll.description,
    createdBy: createdBy._id,
    createdByName: createdBy.name,
    dateRanges: modifications.dateRanges || originalPoll.dateRanges.map(range => ({
      ...range.toObject(),
      id: `${range.id}-copy-${Date.now()}`
    })),
    scenes: modifications.scenes || originalPoll.scenes,
    targetActors: modifications.targetActors || originalPoll.targetActors,
    settings: { ...originalPoll.settings, ...modifications.settings },
    responses: [], // Start with no responses
    status: 'draft'
  };
  
  const duplicatedPoll = new this(duplicatedData);
  return duplicatedPoll.save();
};

module.exports = mongoose.model('Poll', pollSchema);