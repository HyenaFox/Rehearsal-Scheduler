// Auto-scheduler utility functions
import { getGlobalTimeSlotsForDay, isRehearsalDay } from './globalTimeslots.js';

/**
 * Find the best rehearsal opportunities for a given day
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week (e.g., 'Monday', 'Tuesday')
 * @param {Array} existingRehearsals - Array of existing rehearsals to avoid conflicts
 * @param {Array} timeslots - Array of available timeslots (optional, for backward compatibility)
 * @param {Array} scenes - Array of available scenes
 * @returns {Array} Array of rehearsal suggestions
 */
export const findBestRehearsalOpportunities = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = []) => {
  console.log('🤖 [AutoScheduler] Finding opportunities for:', targetDay);
  console.log('🤖 [AutoScheduler] Input data:', {
    actors: actors.length,
    scenes: scenes.length,
    existingRehearsals: existingRehearsals.length
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
        // Find scenes that can be rehearsed with available actors
        const sceneOpportunities = findBestScenesForActors(actors, date, timeSlot, scenes);

        sceneOpportunities.forEach(sceneOpp => {
          opportunities.push({
            date: dateStr,
            dateObj: date,
            timeslot: timeSlot,
            scene: sceneOpp.scene,
            actors: sceneOpp.actors,
            efficiency: sceneOpp.efficiency,
            priority: calculatePriority(sceneOpp.actors.length, sceneOpp.efficiency, timeSlot)
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
 * @returns {Array} Array of scene opportunities
 */
export const findBestScenesForActors = (allActors, date, timeSlot, scenes = []) => {
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

    // Check which of these actors are available at this time
    const availableActors = sceneActors.filter(actor => {
      // Debug logging
      console.log(`🎭 [AutoScheduler] Checking availability for ${actor.name}:`);
      console.log(`   Has availability array: ${actor.availability && Array.isArray(actor.availability)} (length: ${actor.availability ? actor.availability.length : 0})`);
      console.log(`   Has availableTimeslots: ${actor.availableTimeslots && Array.isArray(actor.availableTimeslots)} (length: ${actor.availableTimeslots ? actor.availableTimeslots.length : 0})`);
      
      // Check availability array (UTC timestamps)
      if (actor.availability && Array.isArray(actor.availability) && actor.availability.length > 0) {
        const hasAvailabilityMatch = actor.availability.some(availableSlot => {
          try {
            const availableDate = new Date(availableSlot);
            
            // Debug logging
            console.log(`🕐 [AutoScheduler] Comparing times for ${actor.name}:`);
            console.log(`   Slot time: ${slotDateTime.toISOString()} (${slotDateTime.toLocaleString()})`);
            console.log(`   Available: ${availableDate.toISOString()} (${availableDate.toLocaleString()})`);
            
            // Check if it's the same date first (ignore time temporarily for debugging)
            const slotDateOnly = slotDateTime.toDateString();
            const availableDateOnly = availableDate.toDateString();
            const sameDate = slotDateOnly === availableDateOnly;
            
            console.log(`   Same date? ${sameDate} (${slotDateOnly} vs ${availableDateOnly})`);
            
            if (sameDate) {
              // Check time difference in hours
              const slotHours = slotDateTime.getHours();
              const slotMinutes = slotDateTime.getMinutes();
              const availableHours = availableDate.getHours();
              const availableMinutes = availableDate.getMinutes();
              
              console.log(`   Time comparison: ${slotHours}:${slotMinutes} vs ${availableHours}:${availableMinutes}`);
              
              // Check if the times are within 30 minutes of each other
              const timeDiff = Math.abs(slotDateTime.getTime() - availableDate.getTime());
              const isMatch = timeDiff < 30 * 60 * 1000; // Within 30 minutes
              
              console.log(`   Time diff: ${timeDiff}ms, Match: ${isMatch}`);
              return isMatch;
            }
            
            return false;
          } catch (error) {
            console.log(`   Error comparing times: ${error.message}`);
            return false;
          }
        });
        
        if (hasAvailabilityMatch) {
          console.log(`✅ [AutoScheduler] ${actor.name} is available via availability array`);
          return true;
        }
      }
      
      // Check availableTimeslots array (for backward compatibility)
      if (actor.availableTimeslots && Array.isArray(actor.availableTimeslots) && actor.availableTimeslots.length > 0) {
        console.log(`⏰ [AutoScheduler] ${actor.name} has timeslots but no UTC availability - marking as potentially available`);
        // For now, assume actors with timeslots are available (this is a simplified check)
        // In a full implementation, you'd want to fetch and compare actual timeslot data
        return true;
      }
      
      console.log(`❌ [AutoScheduler] ${actor.name} is not available (no availability data)`);
      return false;
    });

    if (availableActors.length > 0) {
      // Calculate efficiency: ratio of available actors to total actors in scene
      const efficiency = availableActors.length / Math.max(sceneActors.length, 1);

      sceneOpportunities.push({
        scene,
        actors: availableActors,
        efficiency,
        coverage: availableActors.length
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
    notes: `Auto-scheduled with ${opportunity.actors.length} available actors (${Math.round(opportunity.efficiency * 100)}% efficiency)`
  };
};

/**
 * Generate multiple rehearsals for a day (auto-schedule as many as possible)
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week
 * @param {Array} existingRehearsals - Existing rehearsals
 * @param {Array} timeslots - Array of available timeslots (optional, for backward compatibility)
 * @param {Array} scenes - Array of available scenes
 * @param {number} maxRehearsals - Maximum number of rehearsals to create
 * @returns {Array} Array of generated rehearsals
 */
export const autoScheduleDay = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = [], maxRehearsals = 5) => {
  console.log('🤖 [AutoScheduler] Auto-scheduling day:', targetDay);
  
  const generatedRehearsals = [];
  let currentRehearsals = [...existingRehearsals];
  
  for (let i = 0; i < maxRehearsals; i++) {
    const opportunities = findBestRehearsalOpportunities(actors, targetDay, currentRehearsals, timeslots, scenes);
    
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
 * @returns {Object} Summary statistics
 */
export const getSchedulingSummary = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = []) => {
  const opportunities = findBestRehearsalOpportunities(actors, targetDay, existingRehearsals, timeslots, scenes);
  
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
      : 0
  };
};
