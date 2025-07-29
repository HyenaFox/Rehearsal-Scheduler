const mongoose = require('mongoose');

// Individual response from an actor for a specific time slot
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
  timeSlotId: {
    type: String,
    required: true
  },
  responseType: {
    type: String,
    enum: ['available', 'if-needed', 'not-available'],
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  respondedAt: {
    type: Date,
    default: Date.now
  }
});

// Time slot option for the poll
const timeSlotSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  startTime: {
    type: String, // HH:MM format
    required: true
  },
  endTime: {
    type: String, // HH:MM format
    required: true
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
  // Time slots that participants can choose from
  timeSlots: [timeSlotSchema],
  
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

// Method to get responses for a specific time slot
pollSchema.methods.getResponsesForTimeSlot = function(timeSlotId) {
  return this.responses.filter(response => response.timeSlotId === timeSlotId);
};

// Method to get actor's responses
pollSchema.methods.getActorResponses = function(actorId) {
  return this.responses.filter(response => response.actorId.toString() === actorId.toString());
};

// Method to check if actor has responded
pollSchema.methods.hasActorResponded = function(actorId) {
  return this.responses.some(response => response.actorId.toString() === actorId.toString());
};

// Method to update poll summary/analytics
pollSchema.methods.updateSummary = function() {
  const totalTargetActors = this.targetActors.length;
  const uniqueResponders = new Set(this.responses.map(r => r.actorId.toString()));
  
  this.summary.totalResponses = this.responses.length;
  this.summary.responseRate = totalTargetActors > 0 ? (uniqueResponders.size / totalTargetActors) * 100 : 0;
  
  // Calculate optimal time slots
  const timeSlotSummaries = this.timeSlots.map(slot => {
    const slotResponses = this.getResponsesForTimeSlot(slot.id);
    const availableCount = slotResponses.filter(r => r.responseType === 'available').length;
    const ifNeededCount = slotResponses.filter(r => r.responseType === 'if-needed').length;
    const notAvailableCount = slotResponses.filter(r => r.responseType === 'not-available').length;
    
    // Weighted scoring: available=3, if-needed=1, not-available=0
    const totalScore = (availableCount * 3) + (ifNeededCount * 1);
    
    return {
      timeSlotId: slot.id,
      availableCount,
      ifNeededCount,
      notAvailableCount,
      totalScore
    };
  });
  
  // Sort by score (highest first)
  this.summary.optimalTimeSlots = timeSlotSummaries.sort((a, b) => b.totalScore - a.totalScore);
  
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

// Static method to add response to poll
pollSchema.statics.addResponse = async function(pollId, responseData) {
  const poll = await this.findById(pollId);
  if (!poll) {
    throw new Error('Poll not found');
  }
  
  // Remove any existing responses from this actor for this time slot
  poll.responses = poll.responses.filter(response => 
    !(response.actorId.toString() === responseData.actorId.toString() && 
      response.timeSlotId === responseData.timeSlotId)
  );
  
  // Add the new response
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
    timeSlots: modifications.timeSlots || originalPoll.timeSlots.map(slot => ({
      ...slot.toObject(),
      id: `${slot.id}-copy-${Date.now()}`
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