import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';
import { STORAGE_KEYS } from '../types/index';
import { createActor } from '../utils/actorUtils';

interface AppContextType {
  actors: any[];
  rehearsals: any[];
  timeslots: any[];
  scenes: any[];
  setActors: (actors: any[]) => void;
  setRehearsals: (rehearsals: any[]) => void;
  setTimeslots: (timeslots: any[]) => void;
  setScenes: (scenes: any[]) => void;
  handleDeleteActor: (actor: any) => void;
  handleDeleteRehearsal: (index: number) => void;
  handleAddActor: () => void;
  handleSaveActor: (actor: any) => void;
  handleAddRehearsal: (rehearsal: any) => void;
  handleAddMultipleRehearsals: (rehearsals: any[]) => void;
  loadTimeslots: () => Promise<void>;
  loadScenes: () => Promise<void>;
  loadActors: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actors, setActors] = useState<any[]>([]);
  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);

  // Load data from API
  const loadActors = async () => {
    try {
      const apiActors = await ApiService.getAllActors();
      setActors(apiActors);
    } catch (error) {
      console.error('Failed to load actors from API:', error);
      // Fallback to local storage
      const actorsData = await AsyncStorage.getItem(STORAGE_KEYS.ACTORS);
      if (actorsData) {
        setActors(JSON.parse(actorsData));
      }
    }
  };

  const loadTimeslots = async () => {
    try {
      const apiTimeslots = await ApiService.getAllTimeslots();
      setTimeslots(apiTimeslots);
    } catch (error) {
      console.error('Failed to load timeslots from API:', error);
      // Fallback to local storage
      const timeslotsData = await AsyncStorage.getItem(STORAGE_KEYS.TIMESLOTS);
      if (timeslotsData) {
        setTimeslots(JSON.parse(timeslotsData));
      }
    }
  };

  const loadScenes = async () => {
    try {
      const apiScenes = await ApiService.getAllScenes();
      setScenes(apiScenes);
    } catch (error) {
      console.error('Failed to load scenes from API:', error);
      // Fallback to local storage
      const scenesData = await AsyncStorage.getItem(STORAGE_KEYS.SCENES);
      if (scenesData) {
        setScenes(JSON.parse(scenesData));
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data from API/storage
        await Promise.all([
          loadActors(),
          loadTimeslots(), 
          loadScenes()
        ]);

        // Load rehearsals from storage (not from API yet)
        const rehearsalsData = await AsyncStorage.getItem(STORAGE_KEYS.REHEARSALS);
        if (rehearsalsData) {
          setRehearsals(JSON.parse(rehearsalsData));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Save actors when they change
  useEffect(() => {
    if (actors.length > 0) {
      AsyncStorage.setItem(STORAGE_KEYS.ACTORS, JSON.stringify(actors));
    }
  }, [actors]);

  // Save rehearsals when they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.REHEARSALS, JSON.stringify(rehearsals));
  }, [rehearsals]);

  // Save timeslots when they change
  useEffect(() => {
    if (timeslots.length > 0) {
      AsyncStorage.setItem(STORAGE_KEYS.TIMESLOTS, JSON.stringify(timeslots));
    }
  }, [timeslots]);

  // Save scenes when they change
  useEffect(() => {
    if (scenes.length > 0) {
      AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(scenes));
    }
  }, [scenes]);

  const handleDeleteActor = async (actor: any) => {
    try {
      // Delete from API first
      await ApiService.deleteActor(actor.id);
      
      // Update local state after successful deletion
      const updatedActors = actors.filter(a => a.id !== actor.id);
      setActors(updatedActors);
    } catch (error) {
      console.error('Failed to delete actor:', error);
      // Could show an alert to user here
    }
  };

  const handleDeleteRehearsal = (index: number) => {
    const updatedRehearsals = rehearsals.filter((_, i) => i !== index);
    setRehearsals(updatedRehearsals);
  };

  const handleAddActor = async () => {
    try {
      const newId = Date.now().toString();
      const defaultName = `Actor ${actors.length + 1}`;
      const newActor = createActor(newId, defaultName, [], []);
      
      // Save to API first
      const savedActor = await ApiService.createActor(newActor);
      
      // Update local state with the saved actor (in case API returns additional fields)
      const updatedActors = [...actors, savedActor];
      setActors(updatedActors);
    } catch (error) {
      console.error('Failed to create actor:', error);
      // Fallback to local state update
      const newId = Date.now().toString();
      const defaultName = `Actor ${actors.length + 1}`;
      const newActor = createActor(newId, defaultName, [], []);
      const updatedActors = [...actors, newActor];
      setActors(updatedActors);
    }
  };

  const handleSaveActor = async (editedActor: any) => {
    try {
      // Update via API first
      const updatedActor = await ApiService.updateActor(editedActor.id, editedActor);
      
      // Update local state with API response
      const updatedActors = actors.map(actor => 
        actor.id === editedActor.id ? updatedActor : actor
      );
      setActors(updatedActors);
    } catch (error) {
      console.error('Failed to update actor:', error);
      // Fallback to local state update
      const updatedActors = actors.map(actor => 
        actor.id === editedActor.id ? editedActor : actor
      );
      setActors(updatedActors);
    }
  };

  const handleAddRehearsal = (rehearsal: any) => {
    const updatedRehearsals = [...rehearsals, rehearsal];
    setRehearsals(updatedRehearsals);
  };

  const handleAddMultipleRehearsals = (newRehearsals: any[]) => {
    const updatedRehearsals = [...rehearsals, ...newRehearsals];
    setRehearsals(updatedRehearsals);
  };

  const value = {
    actors,
    rehearsals,
    timeslots,
    scenes,
    setActors,
    setRehearsals,
    setTimeslots,
    setScenes,
    handleDeleteActor,
    handleDeleteRehearsal,
    handleAddActor,
    handleSaveActor,
    handleAddRehearsal,
    handleAddMultipleRehearsals,
    loadActors,
    loadTimeslots,
    loadScenes,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
