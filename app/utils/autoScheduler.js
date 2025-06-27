// Auto-scheduler utility functions

/**
 * Find the best rehearsal opportunities for a given day
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week (e.g., 'Monday', 'Tuesday')
 * @param {Array} existingRehearsals - Array of existing rehearsals to avoid conflicts
 * @param {Array} timeslots - Array of available timeslots
 * @param {Array} scenes - Array of available scenes
 * @returns {Array} Array of rehearsal suggestions
 */
export const findBestRehearsalOpportunities = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = []) => {
  // Get timeslots for the target day
  const dayTimeslots = timeslots.filter(timeslot => 
    timeslot.day && timeslot.day.toLowerCase() === targetDay.toLowerCase()
  );

  // Get used timeslots from existing rehearsals
  const usedTimeslots = existingRehearsals.map(rehearsal => rehearsal.timeslot.id);

  const opportunities = [];

  dayTimeslots.forEach(timeslot => {
    // Skip if timeslot is already used
    if (usedTimeslots.includes(timeslot.id)) return;

    // Get actors available for this timeslot
    const availableActors = actors.filter(actor => 
      actor.availableTimeslots && actor.availableTimeslots.includes(timeslot.id || timeslot._id)
    );
    
    if (availableActors.length === 0) return;

    // Find scenes that can be rehearsed with available actors
    const sceneOpportunities = findBestScenesForActors(availableActors, scenes);

    sceneOpportunities.forEach(sceneOpp => {
      opportunities.push({
        timeslot,
        scene: sceneOpp.scene,
        actors: sceneOpp.actors,
        efficiency: sceneOpp.efficiency,
        priority: calculatePriority(sceneOpp.actors.length, sceneOpp.efficiency, timeslot)
      });
    });
  });

  // Sort by priority (highest first)
  return opportunities.sort((a, b) => b.priority - a.priority);
};

/**
 * Find the best scenes that can be rehearsed with available actors
 * @param {Array} availableActors - Actors available for a timeslot
 * @param {Array} scenes - Array of available scenes
 * @returns {Array} Array of scene opportunities
 */
export const findBestScenesForActors = (availableActors, scenes = []) => {
  const sceneOpportunities = [];

  scenes.forEach(scene => {
    // Get actors who are in this scene
    const sceneActors = availableActors.filter(actor => 
      actor.scenes.includes(scene.title)
    );

    if (sceneActors.length > 0) {
      // Calculate efficiency: ratio of available actors to total actors in scene
      const totalActorsInScene = availableActors.filter(actor => 
        actor.scenes.includes(scene.title)
      ).length;
      const efficiency = sceneActors.length / Math.max(totalActorsInScene, 1);

      sceneOpportunities.push({
        scene,
        actors: sceneActors,
        efficiency,
        coverage: sceneActors.length
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
  const title = customTitle || `${opportunity.scene.title} Rehearsal`;
  
  return {
    id: Date.now().toString(),
    title,
    timeslot: opportunity.timeslot,
    actors: opportunity.actors,
    scene: opportunity.scene,
    date: new Date().toISOString(),
    autoGenerated: true,
    efficiency: opportunity.efficiency,
    priority: opportunity.priority
  };
};

/**
 * Generate multiple rehearsals for a day (auto-schedule as many as possible)
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week
 * @param {Array} existingRehearsals - Existing rehearsals
 * @param {Array} timeslots - Array of available timeslots
 * @param {Array} scenes - Array of available scenes
 * @param {number} maxRehearsals - Maximum number of rehearsals to create
 * @returns {Array} Array of generated rehearsals
 */
export const autoScheduleDay = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = [], maxRehearsals = 5) => {
  const generatedRehearsals = [];
  let currentRehearsals = [...existingRehearsals];
  
  for (let i = 0; i < maxRehearsals; i++) {
    const opportunities = findBestRehearsalOpportunities(actors, targetDay, currentRehearsals, timeslots, scenes);
    
    if (opportunities.length === 0) break; // No more opportunities
    
    const bestOpportunity = opportunities[0];
    const newRehearsal = createRehearsalFromOpportunity(bestOpportunity);
    
    generatedRehearsals.push(newRehearsal);
    currentRehearsals.push(newRehearsal);
  }
  
  return generatedRehearsals;
};

/**
 * Get summary statistics for scheduling opportunities
 * @param {Array} actors - Array of all actors
 * @param {string} targetDay - Day of the week
 * @param {Array} existingRehearsals - Existing rehearsals
 * @param {Array} timeslots - Array of available timeslots
 * @param {Array} scenes - Array of available scenes
 * @returns {Object} Summary statistics
 */
export const getSchedulingSummary = (actors, targetDay, existingRehearsals = [], timeslots = [], scenes = []) => {
  const opportunities = findBestRehearsalOpportunities(actors, targetDay, existingRehearsals, timeslots, scenes);
  const dayTimeslots = timeslots.filter(timeslot => 
    timeslot.day && timeslot.day.toLowerCase() === targetDay.toLowerCase()
  );
  
  return {
    totalTimeslots: dayTimeslots.length,
    availableTimeslots: dayTimeslots.length - existingRehearsals.filter(r => 
      dayTimeslots.some(ts => ts.id === r.timeslot.id)
    ).length,
    totalOpportunities: opportunities.length,
    bestOpportunity: opportunities[0] || null,
    averagePriority: opportunities.length > 0 
      ? Math.round(opportunities.reduce((sum, opp) => sum + opp.priority, 0) / opportunities.length)
      : 0
  };
};
