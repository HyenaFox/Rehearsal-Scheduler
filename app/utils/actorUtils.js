// Actor utility functions and data management

// FUNCTIONAL APPROACH - Actor utility functions
export const createActor = (id, name, availableTimeslots = [], scenes = []) => {
  return {
    id,
    name,
    availableTimeslots: [...availableTimeslots], // Array of timeslot IDs
    scenes: [...scenes], // Array of scene titles
  };
};

// Actor utility functions
export const addAvailableTimeslot = (actor, timeslotId) => {
  if (!actor.availableTimeslots.includes(timeslotId)) {
    return {
      ...actor,
      availableTimeslots: [...actor.availableTimeslots, timeslotId]
    };
  }
  return actor;
};

export const removeAvailableTimeslot = (actor, timeslotId) => {
  return {
    ...actor,
    availableTimeslots: actor.availableTimeslots.filter(id => id !== timeslotId)
  };
};

export const addScene = (actor, scene) => {
  return {
    ...actor,
    scenes: [...actor.scenes, scene]
  };
};

export const removeScene = (actor, scene) => {
  return {
    ...actor,
    scenes: actor.scenes.filter(s => s !== scene)
  };
};

export const isAvailable = (actor, timeslotId) => {
  return actor.availableTimeslots.includes(timeslotId);
};

// Helper function to get available timeslots for an actor
export const getAvailableTimeslots = (actor, allTimeslots = []) => {
  if (!actor || !actor.availableTimeslots) return [];
  return allTimeslots.filter(timeslot => 
    actor.availableTimeslots.includes(timeslot.id || timeslot._id)
  );
};

export const getScenes = (actor, allScenes = []) => {
  if (!actor || !actor.scenes) return [];
  return allScenes.filter(scene =>
    actor.scenes.includes(scene.id || scene._id)
  );
};

// Create multiple actors from array data
export const createActors = (actorData) => {
  return actorData.map(data =>
    createActor(data.id, data.name, data.availableTimeslots, data.scenes)
  );
};

// Get actors available for a specific timeslot
export const getActorsAvailableForTimeslot = (actors, timeslotId) => {
  return actors.filter(actor => isAvailable(actor, timeslotId));
};

// Get actors in a specific scene
export const getActorsInScene = (actors, sceneName) => {
  return actors.filter(actor => actor.scenes.includes(sceneName));
};

// Get timeslot by ID
export const getTimeslotById = (timeslotId, timeslots = []) => {
  return timeslots.find(timeslot => (timeslot.id || timeslot._id) === timeslotId);
};

// Get scene by ID
export const getSceneById = (sceneId, scenes = []) => {
  return scenes.find(scene => (scene.id || scene._id) === sceneId);
};
