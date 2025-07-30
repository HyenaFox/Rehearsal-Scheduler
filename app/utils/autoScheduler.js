// Auto-scheduler utility functions
import { getGlobalTimeSlotsForDay, isRehearsalDay } from './globalTimeslots.js';

/**
 * Find the best rehearsal opportunities for a given day
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week (e.g., 'Monday', 'Tuesday')
 * @param {Array} existingRehearsals - Array of existing rehearsals to avoid conflicts
 * @param {Array} timeslots - Array of available timeslots (optional, for backward compatibility)
 * @param {Array} scenes - Array of available scenes
 * @param {Array} polls - Array of active polls with response data (optional)
 * @returns {Array} Array of rehearsal suggestions
 */
export const findBestRehearsalOpportunities = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = [], polls = []) => {
  console.log('🤖 [AutoScheduler] Finding opportunities for:', targetDay);
  console.log('🤖 [AutoScheduler] Input data:', {
    actors: actors.length,
    scenes: scenes.length,
    existingRehearsals: existingRehearsals.length,
    polls: polls.length
  });

  // Generate available dates for the next 7 days
  const availableDates = [];
  const today = new Date();
  const targetDayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .indexOf(targetDay.toLowerCase());
  
  // Check if the target day is a valid rehearsal day
  if (!isRehearsalDay(targetDayIndex)) {
    console.log('🤖 [AutoScheduler] Invalid rehearsal day:', targetDay, '- Only Sunday, Monday, Tuesday, Wednesday, Thursday are allowed');
    return [];
  }
  
  // Find the next occurrence of the target day
  for (let i = 1; i <= 14; i++) { // Look up to 2 weeks ahead
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() === targetDayIndex) {
      availableDates.push(date);
      break; // Just get the next occurrence for now
    }
  }

  if (availableDates.length === 0) {
    console.log('🤖 [AutoScheduler] No dates found for', targetDay);
    return [];
  }

  // Use globally defined timeslots (6 PM to 11:30 PM on rehearsal days only)
  const timeSlots = getGlobalTimeSlotsForDay(targetDayIndex);
  console.log('🤖 [AutoScheduler] Using global timeslots:', timeSlots.length, 'slots from 6 PM to 11:30 PM');

  const opportunities = [];

  availableDates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    
    timeSlots.forEach(timeSlot => {
      // Check for conflicts with existing rehearsals
      const conflictingRehearsal = existingRehearsals.find(r => 
        r.date === dateStr && 
        ((r.startTime <= timeSlot.startTime && r.endTime > timeSlot.startTime) ||
         (r.startTime < timeSlot.endTime && r.endTime >= timeSlot.endTime) ||
         (r.startTime >= timeSlot.startTime && r.endTime <= timeSlot.endTime))
      );

      if (!conflictingRehearsal) {
        // Find scenes that can be rehearsed with available actors (now poll-aware)
        const sceneOpportunities = findBestScenesForActors(actors, date, timeSlot, scenes, polls);

        sceneOpportunities.forEach(sceneOpp => {
          opportunities.push({
            date: dateStr,
            dateObj: date,
            timeslot: timeSlot,
            scene: sceneOpp.scene,
            actors: sceneOpp.actors,
            efficiency: sceneOpp.efficiency,
            priority: calculatePriority(sceneOpp.actors.length, sceneOpp.efficiency, timeSlot),
            pollBased: sceneOpp.pollBased || false,
            availabilityBreakdown: sceneOpp.availabilityBreakdown || null
          });
        });
      }
    });
  });

  console.log('🤖 [AutoScheduler] Found opportunities:', opportunities.length);
  
  // Sort by priority (highest first)
  return opportunities.sort((a, b) => b.priority - a.priority);
};

/**
 * Find the best scenes that can be rehearsed with available actors
 * @param {Array} allActors - All actors in the system
 * @param {Date} date - The date for the rehearsal
 * @param {Object} timeSlot - The time slot for the rehearsal
 * @param {Array} scenes - Array of available scenes
 * @param {Array} polls - Array of active polls with response data
 * @returns {Array} Array of scene opportunities
 */
export const findBestScenesForActors = (allActors, date, timeSlot, scenes = [], polls = []) => {
  const sceneOpportunities = [];
  
  // Create a date object for this specific slot
  const slotDateTime = new Date(date);
  const slotHour = parseInt(timeSlot.startTime.split(':')[0]);
  const slotMinute = parseInt(timeSlot.startTime.split(':')[1] || '0');
  slotDateTime.setHours(slotHour, slotMinute, 0, 0);

  scenes.forEach(scene => {
    // Get actors who are in this scene (check both scene.id and scene._id for compatibility)
    const sceneId = scene.id || scene._id;
    const sceneActors = allActors.filter(actor => {
      // Check if actor.scenes contains this scene ID
      return actor.scenes && (
        actor.scenes.includes(sceneId) || 
        actor.scenes.includes(scene.title) // Backward compatibility
      );
    });

    // Check for poll-based availability first
    const pollAvailability = checkPollAvailability(sceneActors, date, timeSlot, polls);
    
    // If we have poll data for this time slot, use it; otherwise fall back to general availability
    const availableActors = pollAvailability.hasPollData 
      ? pollAvailability.actors 
      : sceneActors.filter(actor => checkGeneralAvailability(actor, slotDateTime));

    if (availableActors.length > 0) {
      // Calculate efficiency: ratio of available actors to total actors in scene
      const efficiency = pollAvailability.hasPollData 
        ? pollAvailability.efficiency 
        : availableActors.length / Math.max(sceneActors.length, 1);

      sceneOpportunities.push({
        scene,
        actors: availableActors,
        efficiency,
        coverage: availableActors.length,
        pollBased: pollAvailability.hasPollData,
        availabilityBreakdown: pollAvailability.breakdown || null
      });
    }
  });

  // Sort by efficiency and coverage
  return sceneOpportunities.sort((a, b) => {
    if (a.efficiency !== b.efficiency) {
      return b.efficiency - a.efficiency; // Higher efficiency first
    }
    return b.coverage - a.coverage; // More actors first
  });
};

/**
 * Check for poll-based availability for actors at a specific time slot (Timeful-style)
 * @param {Array} actors - Actors to check
 * @param {Date} date - Target date
 * @param {Object} timeSlot - Target time slot
 * @param {Array} polls - Active polls with dateRanges
 * @returns {Object} Poll availability data
 */
export const checkPollAvailability = (actors, date, timeSlot, polls) => {
  const dateStr = date.toISOString().split('T')[0];
  const timeKey = `${dateStr}-${timeSlot.startTime}-${timeSlot.endTime}`;
  
  // Find polls that have date ranges covering this date/time
  const relevantPoll = polls.find(poll => 
    poll.dateRanges && poll.dateRanges.some(range => 
      range.date === dateStr && 
      timeOverlaps(timeSlot.startTime, timeSlot.endTime, range.earliestTime, range.latestTime)
    )
  );

  if (!relevantPoll) {
    return { hasPollData: false, actors: [], efficiency: 0, breakdown: null };
  }

  const matchingDateRange = relevantPoll.dateRanges.find(range => 
    range.date === dateStr && 
    timeOverlaps(timeSlot.startTime, timeSlot.endTime, range.earliestTime, range.latestTime)
  );

  if (!matchingDateRange) {
    return { hasPollData: false, actors: [], efficiency: 0, breakdown: null };
  }

  // Get responses for this date range
  const dateRangeResponses = relevantPoll.responses.filter(response => 
    response.dateRangeId === matchingDateRange.id
  );

  const availableActors = [];
  const ifNeededActors = [];
  const notAvailableActors = [];

  actors.forEach(actor => {
    const actorId = actor.id || actor._id;
    const response = dateRangeResponses.find(r => 
      r.actorId.toString() === actorId.toString()
    );

    if (response && response.availabilityBlocks) {
      // Check if any of the actor's availability blocks overlap with this time slot
      const hasAvailableOverlap = response.availabilityBlocks.some(block => 
        block.responseType === 'available' && 
        timeOverlaps(timeSlot.startTime, timeSlot.endTime, block.startTime, block.endTime)
      );
      
      const hasIfNeededOverlap = response.availabilityBlocks.some(block => 
        block.responseType === 'if-needed' && 
        timeOverlaps(timeSlot.startTime, timeSlot.endTime, block.startTime, block.endTime)
      );

      if (hasAvailableOverlap) {
        availableActors.push({ ...actor, pollResponse: 'available' });
      } else if (hasIfNeededOverlap) {
        ifNeededActors.push({ ...actor, pollResponse: 'if-needed' });
      } else {
        notAvailableActors.push({ ...actor, pollResponse: 'not-available' });
      }
    } else {
      // No response - treat as unknown, but check general availability as fallback
      const slotDateTime = new Date(date);
      const slotHour = parseInt(timeSlot.startTime.split(':')[0]);
      const slotMinute = parseInt(timeSlot.startTime.split(':')[1] || '0');
      slotDateTime.setHours(slotHour, slotMinute, 0, 0);
      
      const generallyAvailable = checkGeneralAvailability(actor, slotDateTime);
      if (generallyAvailable) {
        availableActors.push({ ...actor, pollResponse: 'unknown' });
      }
    }
  });

  // Calculate weighted efficiency
  // Available = 1.0, If-needed = 0.5, Not-available = 0.0
  const totalActors = actors.length;
  const weightedAvailable = availableActors.length * 1.0 + ifNeededActors.length * 0.5;
  const efficiency = totalActors > 0 ? weightedAvailable / totalActors : 0;

  // Include both fully available and if-needed actors in the final list
  // but mark them appropriately
  const finalActors = [...availableActors, ...ifNeededActors];

  console.log(`📊 [AutoScheduler] Poll-based availability (Timeful-style):`, {
    timeSlot: timeKey,
    available: availableActors.length,
    ifNeeded: ifNeededActors.length,
    notAvailable: notAvailableActors.length,
    efficiency: Math.round(efficiency * 100) + '%'
  });

  return {
    hasPollData: true,
    actors: finalActors,
    efficiency,
    breakdown: {
      available: availableActors.length,
      ifNeeded: ifNeededActors.length,
      notAvailable: notAvailableActors.length,
      total: totalActors
    }
  };
};

/**
 * Helper function to check if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:MM)
 * @param {string} end1 - End time of first range (HH:MM) 
 * @param {string} start2 - Start time of second range (HH:MM)
 * @param {string} end2 - End time of second range (HH:MM)
 * @returns {boolean} Whether the ranges overlap
 */
const timeOverlaps = (start1, end1, start2, end2) => {
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

/**
 * Check general availability (fallback when no poll data exists)
 * @param {Object} actor - Actor to check
 * @param {Date} slotDateTime - Target date/time
 * @returns {boolean} Whether actor is available
 */
export const checkGeneralAvailability = (actor, slotDateTime) => {
  // Check availability array (UTC timestamps)
  if (actor.availability && Array.isArray(actor.availability) && actor.availability.length > 0) {
    const hasAvailabilityMatch = actor.availability.some(availableSlot => {
      try {
        const availableDate = new Date(availableSlot);
        
        // Check if it's the same date first
        const slotDateOnly = slotDateTime.toDateString();
        const availableDateOnly = availableDate.toDateString();
        const sameDate = slotDateOnly === availableDateOnly;
        
        if (sameDate) {
          // Check if the times are within 30 minutes of each other
          const timeDiff = Math.abs(slotDateTime.getTime() - availableDate.getTime());
          const isMatch = timeDiff < 30 * 60 * 1000; // Within 30 minutes
          return isMatch;
        }
        
        return false;
      } catch (error) {
        return false;
      }
    });
    
    if (hasAvailabilityMatch) {
      return true;
    }
  }
  
  // Check availableTimeslots array (for backward compatibility)
  if (actor.availableTimeslots && Array.isArray(actor.availableTimeslots) && actor.availableTimeslots.length > 0) {
    // For now, assume actors with timeslots are available (this is a simplified check)
    return true;
  }
  
  return false;
};

/**
 * Calculate priority score for a rehearsal opportunity
 * @param {number} actorCount - Number of actors involved
 * @param {number} efficiency - Efficiency score (0-1)
 * @param {Object} timeslot - Timeslot object
 * @returns {number} Priority score
 */
export const calculatePriority = (actorCount, efficiency, timeslot) => {
  let score = 0;
  
  // More actors = higher priority (up to 50 points)
  score += Math.min(actorCount * 10, 50);
  
  // Higher efficiency = higher priority (up to 30 points)
  score += efficiency * 30;
  
  // Longer timeslots get slight preference (up to 20 points)
  const duration = getTimeslotDuration(timeslot);
  score += Math.min(duration / 30, 20); // 30 minutes = 1 point, max 20
  
  return Math.round(score);
};

/**
 * Get duration of a timeslot in minutes
 * @param {Object} timeslot - Timeslot object
 * @returns {number} Duration in minutes
 */
export const getTimeslotDuration = (timeslot) => {
  // Simple calculation based on common patterns
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
  
  const startMatch = timePattern.exec(timeslot.startTime);
  timePattern.lastIndex = 0; // Reset regex
  const endMatch = timePattern.exec(timeslot.endTime);
  
  if (!startMatch || !endMatch) return 120; // Default 2 hours
  
  const startHour = parseInt(startMatch[1]) + (startMatch[3].toUpperCase() === 'PM' && startMatch[1] !== '12' ? 12 : 0);
  const startMin = parseInt(startMatch[2]);
  const endHour = parseInt(endMatch[1]) + (endMatch[3].toUpperCase() === 'PM' && endMatch[1] !== '12' ? 12 : 0);
  const endMin = parseInt(endMatch[2]);
  
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
};

/**
 * Create a rehearsal from an opportunity
 * @param {Object} opportunity - Rehearsal opportunity
 * @param {string} customTitle - Optional custom title
 * @returns {Object} Rehearsal object
 */
export const createRehearsalFromOpportunity = (opportunity, customTitle = null) => {
  // Use scene title as the rehearsal title, no "Rehearsal" suffix
  const title = customTitle || opportunity.scene.title;
  
  return {
    id: `rehearsal_${Date.now()}`,
    title,
    sceneId: opportunity.scene.id || opportunity.scene._id,
    date: opportunity.date,
    time: {
      start: opportunity.timeslot.startTime,
      end: opportunity.timeslot.endTime
    },
    actors: opportunity.actors,
    scene: opportunity.scene.title, // Store scene title as string for compatibility
    autoGenerated: true,
    efficiency: opportunity.efficiency,
    priority: opportunity.priority,
    pollBased: opportunity.pollBased,
    availabilityBreakdown: opportunity.availabilityBreakdown,
    notes: opportunity.pollBased 
      ? `Auto-scheduled with poll data: ${opportunity.availabilityBreakdown?.available || 0} available, ${opportunity.availabilityBreakdown?.ifNeeded || 0} if-needed (${Math.round(opportunity.efficiency * 100)}% efficiency)`
      : `Auto-scheduled with ${opportunity.actors.length} available actors (${Math.round(opportunity.efficiency * 100)}% efficiency)`
  };
};

/**
 * Generate multiple rehearsals for a day (auto-schedule as many as possible)
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week
 * @param {Array} existingRehearsals - Existing rehearsals
 * @param {Array} timeslots - Array of available timeslots (optional, for backward compatibility)
 * @param {Array} scenes - Array of available scenes
 * @param {Array} polls - Array of active polls with response data
 * @param {number} maxRehearsals - Maximum number of rehearsals to create
 * @returns {Array} Array of generated rehearsals
 */
export const autoScheduleDay = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = [], polls = [], maxRehearsals = 5) => {
  console.log('🤖 [AutoScheduler] Auto-scheduling day:', targetDay);
  
  const generatedRehearsals = [];
  let currentRehearsals = [...existingRehearsals];
  
  for (let i = 0; i < maxRehearsals; i++) {
    const opportunities = findBestRehearsalOpportunities(actors, targetDay, currentRehearsals, timeslots, scenes, polls);
    
    if (opportunities.length === 0) {
      console.log('🤖 [AutoScheduler] No more opportunities found, stopping at', i, 'rehearsals');
      break; // No more opportunities
    }
    
    const bestOpportunity = opportunities[0];
    console.log('🤖 [AutoScheduler] Creating rehearsal for:', bestOpportunity.scene.title, 'with', bestOpportunity.actors.length, 'actors');
    
    const newRehearsal = createRehearsalFromOpportunity(bestOpportunity);
    
    generatedRehearsals.push(newRehearsal);
    currentRehearsals.push(newRehearsal);
  }
  
  console.log('🤖 [AutoScheduler] Generated', generatedRehearsals.length, 'rehearsals');
  return generatedRehearsals;
};

/**
 * Get summary statistics for scheduling opportunities
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week
 * @param {Array} existingRehearsals - Existing rehearsals
 * @param {Array} timeslots - Array of available timeslots (optional, for backward compatibility)
 * @param {Array} scenes - Array of available scenes
 * @param {Array} polls - Array of active polls with response data
 * @returns {Object} Summary statistics
 */
export const getSchedulingSummary = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = [], polls = []) => {
  const opportunities = findBestRehearsalOpportunities(actors, targetDay, existingRehearsals, timeslots, scenes, polls);
  
  // Generate available time slots for the day
  const timeSlots = [];
  for (let hour = 9; hour <= 19; hour += 2) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
    const startTime12 = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime12 = new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    timeSlots.push({
      id: `${hour}:00-${hour + 2}:00`,
      startTime: startTime,
      endTime: endTime,
      label: `${startTime12} - ${endTime12}`
    });
  }
  
  return {
    totalTimeslots: timeSlots.length,
    availableTimeslots: timeSlots.length - existingRehearsals.filter(r => {
      // Check if rehearsal is on the target day
      const rehearsalDate = new Date(r.date);
      const targetDayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(targetDay.toLowerCase());
      return rehearsalDate.getDay() === targetDayIndex;
    }).length,
    totalOpportunities: opportunities.length,
    bestOpportunity: opportunities[0] || null,
    averagePriority: opportunities.length > 0 
      ? Math.round(opportunities.reduce((sum, opp) => sum + opp.priority, 0) / opportunities.length)
      : 0,
    pollBasedOpportunities: opportunities.filter(opp => opp.pollBased).length
  };
};