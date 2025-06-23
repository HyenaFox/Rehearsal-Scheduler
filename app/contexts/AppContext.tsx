import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../types/index';
import { createActor } from '../utils/actorUtils';

interface AppContextType {
  actors: any[];
  rehearsals: any[];
  setActors: (actors: any[]) => void;
  setRehearsals: (rehearsals: any[]) => void;
  handleDeleteActor: (actor: any) => void;
  handleDeleteRehearsal: (index: number) => void;
  handleAddActor: () => void;
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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load actors from storage
        const actorsData = await AsyncStorage.getItem(STORAGE_KEYS.ACTORS);
        if (actorsData) {
          setActors(JSON.parse(actorsData));
        } else {
          // Use default data if nothing in storage
          const defaultActors = [
            createActor('1', 'Eleanor Vance', ['mon-2pm-4pm', 'wed-10am-1pm'], ['Act I, Scene 2', 'Act II, Scene 1']),
            createActor('2', 'Leo Maxwell', ['tue-3pm-5pm', 'fri-11am-2pm'], ['Act I, Scene 1', 'Act II, Scene 3']),
            createActor('3', 'Clara Beaumont', ['mon-2pm-4pm', 'thu-6pm-8pm'], ['Act I, Scene 2', 'Act III, Scene 4']),
            createActor('4', 'Julian Adler', ['wed-10am-1pm', 'fri-11am-2pm'], ['Act II, Scene 1', 'Act II, Scene 3']),
            createActor('5', 'Aurora Chen', ['tue-3pm-5pm', 'thu-6pm-8pm'], ['Act I, Scene 1', 'Act III, Scene 4']),
          ];
          setActors(defaultActors);
          await AsyncStorage.setItem(STORAGE_KEYS.ACTORS, JSON.stringify(defaultActors));
        }

        // Load rehearsals from storage
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

  const handleDeleteActor = (actor: any) => {
    // Direct deletion without confirmation
    const updatedActors = actors.filter(a => a.id !== actor.id);
    setActors(updatedActors);
  };

  const handleDeleteRehearsal = (index: number) => {
    const updatedRehearsals = rehearsals.filter((_, i) => i !== index);
    setRehearsals(updatedRehearsals);
  };
  const handleAddActor = () => {
    const newId = Date.now().toString();
    const defaultName = `Actor ${actors.length + 1}`;
    const newActor = createActor(newId, defaultName, [], []);
    const updatedActors = [...actors, newActor];
    setActors(updatedActors);
  };

  const value = {
    actors,
    rehearsals,
    setActors,
    setRehearsals,
    handleDeleteActor,
    handleDeleteRehearsal,
    handleAddActor,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
