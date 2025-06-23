// General utility functions

// Get actors available for a specific timeslot
export const getActorsAvailableForTimeslot = (actors, timeslotId) => {
  return actors.filter(actor => actor.availableTimeslots.includes(timeslotId));
};

// Get actors that are in a specific scene
export const getActorsInScene = (actors, sceneName) => {
  return actors.filter(actor => actor.scenes.includes(sceneName));
};

// Get timeslot by ID
export const getTimeslotById = (timeslotId, globalTimeslots) => {
  return globalTimeslots.find(timeslot => timeslot.id === timeslotId);
};

// Get scene by ID
export const getSceneById = (sceneId, globalScenes) => {
  return globalScenes.find(scene => scene.id === sceneId);
};
