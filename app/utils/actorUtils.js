// Actor utility functions and data management
import { GLOBAL_SCENES, GLOBAL_TIMESLOTS } from '../types/index';

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
export const getAvailableTimeslots = (actor) => {
  return GLOBAL_TIMESLOTS.filter(timeslot => 
    actor.availableTimeslots.includes(timeslot.id)
  );
};

export const getScenes = (actor) => {
  return actor.scenes;
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
export const getTimeslotById = (timeslotId) => {
  return GLOBAL_TIMESLOTS.find(timeslot => timeslot.id === timeslotId);
};

// Get scene by ID
export const getSceneById = (sceneId) => {
  return GLOBAL_SCENES.find(scene => scene.id === sceneId);
};
