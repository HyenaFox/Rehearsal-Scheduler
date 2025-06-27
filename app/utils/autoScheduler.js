/**
 * Auto Scheduler Utility Functions
 * 
 * This module provides intelligent scheduling algorithms for rehearsals.
 * All functions are fully parameterized and database-driven.
 */

/**
 * Find the best rehearsal opportunities for a given day
 * @param {Array} actors - List of all actors
 * @param {string} selectedDay - Day to schedule for
 * @param {Array} existingRehearsals - Already scheduled rehearsals
 * @param {Array} timeslots - Available timeslots
 * @param {Array} scenes - Available scenes
 * @returns {Array} Array of rehearsal opportunities sorted by priority
 */
export function findBestRehearsalOpportunities(actors, selectedDay, existingRehearsals, timeslots, scenes) {
  if (!actors || !timeslots || !scenes || !selectedDay) {
    console.log('Missing required data for scheduling:', { actors: !!actors, timeslots: !!timeslots, scenes: !!scenes, selectedDay: !!selectedDay });
    return [];
  }

  const opportunities = [];
  
  // Get timeslots for the selected day
  const dayTimeslots = timeslots.filter(ts => ts.day === selectedDay);
  
  if (dayTimeslots.length === 0) {
    console.log(`No timeslots found for ${selectedDay}`);
    return [];
  }
  
  // Get available timeslots (not already used in existing rehearsals)
  const availableTimeslots = dayTimeslots.filter(timeslot => {
    return !existingRehearsals.some(rehearsal => 
      rehearsal.timeslotId === timeslot.id || 
      (rehearsal.timeslot && rehearsal.timeslot.id === timeslot.id)
    );
  });

  if (availableTimeslots.length === 0) {
    console.log(`No available timeslots for ${selectedDay} - all are booked`);
    return [];
  }

  // For each available timeslot, find scenes that can be rehearsed
  availableTimeslots.forEach(timeslot => {
    scenes.forEach(scene => {
      // Get actors available for this timeslot
      const availableActors = getAvailableActors(actors, timeslot, existingRehearsals);
      
      // Get actors needed for this scene
      const sceneActors = getSceneActors(scene, availableActors);
      
      // If we have at least some actors for the scene, create an opportunity
      if (sceneActors.length > 0) {
        const opportunity = {
          timeslot,
          scene,
          actors: sceneActors,
          priority: calculatePriority(scene, sceneActors, timeslot),
          efficiency: calculateEfficiency(scene, sceneActors),
          id: `${timeslot.id}-${scene.id}` // Unique identifier
        };
        
        opportunities.push(opportunity);
      }
    });
  });

  console.log(`Found ${opportunities.length} opportunities for ${selectedDay}`);
  
  // Sort by priority (highest first)
  return opportunities.sort((a, b) => b.priority - a.priority);
}

/**
 * Get actors available for a specific timeslot
 * @param {Array} actors - All actors
 * @param {Object} timeslot - The timeslot to check
 * @param {Array} existingRehearsals - Already scheduled rehearsals
 * @returns {Array} Available actors for this timeslot
 */
function getAvailableActors(actors, timeslot, existingRehearsals) {
  return actors.filter(actor => {
    // Check if actor is available for this timeslot (using availableTimeslots array)
    const isAvailable = actor.availableTimeslots && 
      actor.availableTimeslots.includes(timeslot.id);
    
    if (!isAvailable) return false;
    
    // Check if actor is already scheduled for another rehearsal at this time
    const isAlreadyScheduled = existingRehearsals.some(rehearsal => {
      const rehearsalTimeslot = rehearsal.timeslot || 
        (rehearsal.timeslotId && timeslot.id === rehearsal.timeslotId);
      return rehearsalTimeslot && 
        rehearsal.actors && 
        rehearsal.actors.some(a => a.id === actor.id);
    });
    
    return !isAlreadyScheduled;
  });
}

/**
 * Get actors from a scene that are available
 * @param {Object} scene - The scene
 * @param {Array} availableActors - Actors available for the timeslot
 * @returns {Array} Actors from the scene who are available
 */
function getSceneActors(scene, availableActors) {
  // Handle different scene structures
  let sceneActorIds = [];
  
  if (scene.actors && Array.isArray(scene.actors)) {
    // If scene has actors array with objects
    sceneActorIds = scene.actors.map(actor => actor.id || actor);
  } else if (scene.actorIds && Array.isArray(scene.actorIds)) {
    // If scene has actorIds array
    sceneActorIds = scene.actorIds;
  } else {
    // Find actors by checking their scenes array (legacy format)
    sceneActorIds = availableActors
      .filter(actor => actor.scenes && actor.scenes.includes(scene.title || scene.name || scene.id))
      .map(actor => actor.id);
  }
  
  // Return available actors that are in this scene
  return availableActors.filter(actor => 
    sceneActorIds.includes(actor.id)
  );
}

/**
 * Calculate priority score for a rehearsal opportunity
 * @param {Object} scene - The scene
 * @param {Array} actors - Available actors for the scene
 * @param {Object} timeslot - The timeslot
 * @returns {number} Priority score (0-100)
 */
function calculatePriority(scene, actors, timeslot) {
  let priority = 50; // Base priority
  
  // Higher priority for scenes with more actors available
  const totalSceneActors = getSceneActorCount(scene);
  if (totalSceneActors > 0) {
    const actorCoverage = actors.length / totalSceneActors;
    priority += actorCoverage * 30; // Up to 30 points for full actor coverage
  } else {
    // If no specific actors assigned to scene, give moderate priority
    priority += Math.min(actors.length * 5, 20); // Up to 20 points based on available actors
  }
  
  // Higher priority for scenes that haven't been rehearsed much
  if (scene.rehearsalCount !== undefined) {
    const rehearsalBonus = Math.max(0, 20 - (scene.rehearsalCount * 5));
    priority += rehearsalBonus; // Up to 20 points for less rehearsed scenes
  }
  
  // Higher priority for peak rehearsal times (if defined)
  if (timeslot.isPeakTime) {
    priority += 10;
  }
  
  // Boost priority if we have a reasonable number of actors
  if (actors.length >= 2) {
    priority += 5; // Small bonus for multi-actor scenes
  }
  
  // Ensure priority is within bounds
  return Math.min(100, Math.max(0, Math.round(priority)));
}

/**
 * Get the total number of actors assigned to a scene
 * @param {Object} scene - The scene
 * @returns {number} Number of actors in the scene
 */
function getSceneActorCount(scene) {
  if (scene.actors && Array.isArray(scene.actors)) {
    return scene.actors.length;
  } else if (scene.actorIds && Array.isArray(scene.actorIds)) {
    return scene.actorIds.length;
  }
  // For legacy format, we can't determine this easily, so return 1
  return 1;
}

/**
 * Calculate efficiency of actor usage for a rehearsal
 * @param {Object} scene - The scene
 * @param {Array} availableActors - Available actors
 * @returns {number} Efficiency score (0-1)
 */
function calculateEfficiency(scene, availableActors) {
  const totalSceneActors = getSceneActorCount(scene);
  
  if (totalSceneActors === 0) {
    // If no specific actors for scene, efficiency based on having some actors
    return availableActors.length > 0 ? 0.5 : 0;
  }
  
  // Efficiency is the percentage of scene actors that are available
  return Math.min(1, availableActors.length / totalSceneActors);
}

/**
 * Create a rehearsal object from an opportunity
 * @param {Object} opportunity - The rehearsal opportunity
 * @returns {Object} Formatted rehearsal object
 */
export function createRehearsalFromOpportunity(opportunity) {
  return {
    id: `rehearsal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `${opportunity.scene.title} Rehearsal`,
    scene: opportunity.scene,
    sceneId: opportunity.scene.id,
    timeslot: opportunity.timeslot,
    timeslotId: opportunity.timeslot.id,
    actors: opportunity.actors,
    date: new Date().toISOString().split('T')[0], // Today's date as default
    notes: `Auto-scheduled rehearsal (Priority: ${opportunity.priority}, Efficiency: ${Math.round(opportunity.efficiency * 100)}%)`,
    createdAt: new Date().toISOString(),
    isAutoScheduled: true
  };
}

/**
 * Get scheduling summary for a specific day
 * @param {Array} actors - All actors
 * @param {string} selectedDay - Day to analyze
 * @param {Array} existingRehearsals - Already scheduled rehearsals
 * @param {Array} timeslots - Available timeslots
 * @param {Array} scenes - Available scenes
 * @returns {Object} Summary statistics
 */
export function getSchedulingSummary(actors, selectedDay, existingRehearsals, timeslots, scenes) {
  if (!timeslots || !selectedDay) {
    return {
      totalTimeslots: 0,
      availableTimeslots: 0,
      totalOpportunities: 0,
      bestOpportunity: null
    };
  }

  const dayTimeslots = timeslots.filter(ts => ts.day === selectedDay);
  const availableTimeslots = dayTimeslots.filter(timeslot => {
    return !existingRehearsals.some(rehearsal => 
      rehearsal.timeslotId === timeslot.id || 
      (rehearsal.timeslot && rehearsal.timeslot.id === timeslot.id)
    );
  });

  const opportunities = findBestRehearsalOpportunities(actors, selectedDay, existingRehearsals, timeslots, scenes);
  
  return {
    totalTimeslots: dayTimeslots.length,
    availableTimeslots: availableTimeslots.length,
    totalOpportunities: opportunities.length,
    bestOpportunity: opportunities.length > 0 ? opportunities[0] : null
  };
}

/**
 * Auto-schedule multiple rehearsals for an entire day
 * @param {Array} actors - All actors
 * @param {string} selectedDay - Day to schedule
 * @param {Array} existingRehearsals - Already scheduled rehearsals
 * @param {Array} timeslots - Available timeslots
 * @param {Array} scenes - Available scenes
 * @param {number} maxRehearsals - Maximum number of rehearsals to create
 * @returns {Array} Array of created rehearsals
 */
export function autoScheduleDay(actors, selectedDay, existingRehearsals, timeslots, scenes, maxRehearsals = 5) {
  const newRehearsals = [];
  let currentRehearsals = [...existingRehearsals];
  
  for (let i = 0; i < maxRehearsals; i++) {
    // Find opportunities with current state
    const opportunities = findBestRehearsalOpportunities(actors, selectedDay, currentRehearsals, timeslots, scenes);
    
    if (opportunities.length === 0) {
      break; // No more opportunities
    }
    
    // Take the best opportunity
    const bestOpportunity = opportunities[0];
    const newRehearsal = createRehearsalFromOpportunity(bestOpportunity);
    
    // Add to our results and update current state
    newRehearsals.push(newRehearsal);
    currentRehearsals.push(newRehearsal);
  }
  
  return newRehearsals;
}

/**
 * Validate that all required data is available for scheduling
 * @param {Array} actors - All actors
 * @param {Array} timeslots - Available timeslots
 * @param {Array} scenes - Available scenes
 * @returns {Object} Validation result with any missing requirements
 */
export function validateSchedulingData(actors, timeslots, scenes) {
  const issues = [];
  
  if (!actors || actors.length === 0) {
    issues.push('No actors available');
  }
  
  if (!timeslots || timeslots.length === 0) {
    issues.push('No timeslots available');
  }
  
  if (!scenes || scenes.length === 0) {
    issues.push('No scenes available');
  }
  
  // Check if actors have availability
  if (actors && actors.length > 0) {
    const actorsWithAvailability = actors.filter(actor => 
      actor.availableTimeslots && actor.availableTimeslots.length > 0
    );
    if (actorsWithAvailability.length === 0) {
      issues.push('No actors have timeslot availability set');
    }
  }
  
  // Check if scenes have actors assigned (or if actors are assigned to scenes)
  if (scenes && scenes.length > 0 && actors && actors.length > 0) {
    const scenesWithActors = scenes.filter(scene => {
      // Check if scene has direct actor assignments
      if (scene.actors && scene.actors.length > 0) return true;
      if (scene.actorIds && scene.actorIds.length > 0) return true;
      
      // Check if any actors have this scene in their scenes list
      return actors.some(actor => 
        actor.scenes && actor.scenes.includes(scene.title || scene.name || scene.id)
      );
    });
    
    if (scenesWithActors.length === 0) {
      issues.push('No scenes have actors assigned (check both scene.actors and actor.scenes)');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    debug: {
      actorCount: actors ? actors.length : 0,
      timeslotCount: timeslots ? timeslots.length : 0,
      sceneCount: scenes ? scenes.length : 0,
      actorsWithAvailability: actors ? actors.filter(a => a.availableTimeslots && a.availableTimeslots.length > 0).length : 0,
      actorsWithScenes: actors ? actors.filter(a => a.scenes && a.scenes.length > 0).length : 0
    }
  };
}
