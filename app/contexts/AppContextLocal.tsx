// Updated AppContext that works without backend server
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [actors, setActors] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [rehearsals, setRehearsals] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate timeslots client-side (no server needed)
  const generateTimeslots = () => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];
    const timeslots = [];
    
    DAYS.forEach(day => {
      for (let hour = 17; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const hour12 = hour > 12 ? hour - 12 : hour;
          const period = 'PM';
          const minute12 = minute.toString().padStart(2, '0');
          
          if (hour === 22 && minute === 30) continue;
          
          const time = `${hour12}:${minute12} ${period}`;
          timeslots.push({
            id: `${day}_${time}`,
            day,
            startTime: time,
            endTime: getNextTimeSlot(time),
            available: true,
            duration: 30
          });
        }
      }
    });
    
    return timeslots;
  };

  const getNextTimeSlot = (currentTime) => {
    const timeSlots = generateTimeSlots();
    const currentIndex = timeSlots.indexOf(currentTime);
    return timeSlots[currentIndex + 1] || '11:30 PM';
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 17; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hour12 = hour > 12 ? hour - 12 : hour;
        const period = 'PM';
        const minute12 = minute.toString().padStart(2, '0');
        
        if (hour === 22 && minute === 30) continue;
        
        slots.push(`${hour12}:${minute12} ${period}`);
      }
    }
    return slots;
  };

  // Load data from local storage
  const loadLocalData = async () => {
    try {
      const [storedActors, storedScenes, storedRehearsals] = await Promise.all([
        AsyncStorage.getItem('actors'),
        AsyncStorage.getItem('scenes'),
        AsyncStorage.getItem('rehearsals')
      ]);

      if (storedActors) setActors(JSON.parse(storedActors));
      if (storedScenes) setScenes(JSON.parse(storedScenes));
      if (storedRehearsals) setRehearsals(JSON.parse(storedRehearsals));
      
      // Generate timeslots (no storage needed)
      setTimeslots(generateTimeslots());
      
    } catch (error) {
      console.error('Error loading local data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save data to local storage
  const saveLocalData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // CRUD operations for scenes (global)
  const createScene = async (scene) => {
    const newScene = {
      ...scene,
      _id: Date.now().toString(), // Simple ID generation
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    await saveLocalData('scenes', updatedScenes);
    return newScene;
  };

  const updateScene = async (id, updates) => {
    const updatedScenes = scenes.map(scene => 
      scene._id === id ? { ...scene, ...updates, updatedAt: new Date() } : scene
    );
    setScenes(updatedScenes);
    await saveLocalData('scenes', updatedScenes);
  };

  const deleteScene = async (id) => {
    const updatedScenes = scenes.filter(scene => scene._id !== id);
    setScenes(updatedScenes);
    await saveLocalData('scenes', updatedScenes);
  };

  // CRUD operations for rehearsals (global)
  const createRehearsal = async (rehearsal) => {
    const newRehearsal = {
      ...rehearsal,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedRehearsals = [...rehearsals, newRehearsal];
    setRehearsals(updatedRehearsals);
    await saveLocalData('rehearsals', updatedRehearsals);
    return newRehearsal;
  };

  const updateRehearsal = async (id, updates) => {
    const updatedRehearsals = rehearsals.map(rehearsal => 
      rehearsal.id === id ? { ...rehearsal, ...updates, updatedAt: new Date() } : rehearsal
    );
    setRehearsals(updatedRehearsals);
    await saveLocalData('rehearsals', updatedRehearsals);
  };

  const deleteRehearsal = async (id) => {
    const updatedRehearsals = rehearsals.filter(rehearsal => rehearsal.id !== id);
    setRehearsals(updatedRehearsals);
    await saveLocalData('rehearsals', updatedRehearsals);
  };

  // CRUD operations for actors
  const createActor = async (actor) => {
    const newActor = {
      ...actor,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedActors = [...actors, newActor];
    setActors(updatedActors);
    await saveLocalData('actors', updatedActors);
    return newActor;
  };

  const updateActor = async (id, updates) => {
    const updatedActors = actors.map(actor => 
      actor.id === id ? { ...actor, ...updates, updatedAt: new Date() } : actor
    );
    setActors(updatedActors);
    await saveLocalData('actors', updatedActors);
  };

  const deleteActor = async (id) => {
    const updatedActors = actors.filter(actor => actor.id !== id);
    setActors(updatedActors);
    await saveLocalData('actors', updatedActors);
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  const value = {
    // Data
    actors,
    scenes,
    rehearsals,
    timeslots,
    isLoading,

    // Setters
    setActors,
    setScenes,
    setRehearsals,
    setTimeslots,

    // CRUD operations
    createScene,
    updateScene,
    deleteScene,
    createRehearsal,
    updateRehearsal,
    deleteRehearsal,
    createActor,
    updateActor,
    deleteActor,

    // Utilities
    generateTimeslots,
    loadLocalData,
    saveLocalData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
