// --- Actor Class and Factory ---
class Actor {
  constructor(id, name, timeslots = [], scenes = []) {
    this.id = id;
    this.name = name;
    this.timeslots = timeslots;
    this.scenes = scenes;
  }

  addTimeslot(timeslot) {
    this.timeslots.push(timeslot);
  }

  addScene(scene) {
    this.scenes.push(scene);
  }

  removeTimeslot(timeslot) {
    this.timeslots = this.timeslots.filter(slot => slot !== timeslot);
  }

  removeScene(scene) {
    this.scenes = this.scenes.filter(s => s !== scene);
  }

  isAvailable(timeslot) {
    return this.timeslots.includes(timeslot);
  }

  getScenes() {
    return this.scenes;
  }
}

const createActor = (id, name, timeslots = [], scenes = []) => {
  return new Actor(id, name, timeslots, scenes);
};

const createActors = (actorData) => {
  return actorData.map(data => 
    createActor(data.id, data.name, data.timeslots, data.scenes)
  );
};

const actorData = [
  {
    id: '1',
    name: 'Eleanor Vance',
    timeslots: ['Mon, 2:00 PM - 4:00 PM', 'Wed, 10:00 AM - 1:00 PM'],
    scenes: ['Act I, Scene 2', 'Act II, Scene 1'],
  },
  {
    id: '2',
    name: 'Leo Maxwell',
    timeslots: ['Tue, 3:00 PM - 5:00 PM', 'Fri, 11:00 AM - 2:00 PM'],
    scenes: ['Act I, Scene 1', 'Act II, Scene 3'],
  },
  {
    id: '3',
    name: 'Clara Beaumont',
    timeslots: ['Mon, 2:00 PM - 4:00 PM', 'Thu, 6:00 PM - 8:00 PM'],
    scenes: ['Act I, Scene 2', 'Act III, Scene 4'],
  },
  {
    id: '4',
    name: 'Julian Adler',
    timeslots: ['Wed, 10:00 AM - 1:00 PM', 'Fri, 11:00 AM - 2:00 PM'],
    scenes: ['Act II, Scene 1', 'Act II, Scene 3'],
  },
  {
    id: '5',
    name: 'Aurora Chen',
    timeslots: ['Tue, 3:00 PM - 5:00 PM', 'Thu, 6:00 PM - 8:00 PM'],
    scenes: ['Act I, Scene 1', 'Act III, Scene 4'],
  },
];

export const actors = createActors(actorData);
export { Actor, createActor, createActors };