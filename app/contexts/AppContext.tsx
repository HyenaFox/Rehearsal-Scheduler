import React, { createContext, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';
import { useAuth } from './AuthContext';

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
  handleAddRehearsal: (rehearsal: any) => void;
  handleAddMultipleRehearsals: (rehearsals: any[]) => void;
  loadData: () => Promise<void>;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadData = async () => {
    if (!user) {
      // For guests or no user, use empty arrays
      console.log('AppContext - No user, setting empty data arrays');
      setActors([]);
      setRehearsals([]);
      setTimeslots([]);
      setScenes([]);
      return;
    }

    if (user.id === 'guest') {
      // For guest users, use empty arrays
      console.log('AppContext - Guest user, setting empty data arrays');
      setActors([]);
      setRehearsals([]);
      setTimeslots([]);
      setScenes([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Loading data from API...');
      
      // Load all data from API in parallel
      const [actorsData, timeslotsData, scenesData, rehearsalsData] = await Promise.all([
        ApiService.getAllActors().catch(err => {
          console.warn('Failed to load actors:', err);
          return [];
        }),
        ApiService.getAllTimeslots().catch(err => {
          console.warn('Failed to load timeslots:', err);
          return [];
        }),
        ApiService.getAllScenes().catch(err => {
          console.warn('Failed to load scenes:', err);
          return [];
        }),
        ApiService.getAllRehearsals().catch(err => {
          console.warn('Failed to load rehearsals:', err);
          return [];
        })
      ]);

      console.log('📦 Data loaded:', {
        actors: actorsData.length,
        timeslots: timeslotsData.length,
        scenes: scenesData.length,
        rehearsals: rehearsalsData.length
      });

      setActors(actorsData);
      setTimeslots(timeslotsData);
      setScenes(scenesData);
      setRehearsals(rehearsalsData);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      // Set empty arrays on error
      setActors([]);
      setTimeslots([]);
      setScenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeleteActor = async (actor: any) => {
    try {
      await ApiService.deleteActor(actor.id);
      const updatedActors = actors.filter(a => a.id !== actor.id);
      setActors(updatedActors);
      console.log('✅ Actor deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting actor:', error);
      throw error;
    }
  };

  const handleDeleteRehearsal = async (index: number) => {
    try {
      const rehearsalToDelete = rehearsals[index];
      if (rehearsalToDelete.id && rehearsalToDelete.id !== 'local') {
        // Delete from backend if it has a real ID
        await ApiService.deleteRehearsal(rehearsalToDelete.id);
        console.log('✅ Rehearsal deleted from backend successfully');
      }
      const updatedRehearsals = rehearsals.filter((_, i) => i !== index);
      setRehearsals(updatedRehearsals);
    } catch (error) {
      console.error('❌ Error deleting rehearsal from backend:', error);
      // Still remove from local state even if backend fails
      const updatedRehearsals = rehearsals.filter((_, i) => i !== index);
      setRehearsals(updatedRehearsals);
      throw error;
    }
  };

  const handleAddActor = async () => {
    try {
      const defaultName = `Actor ${actors.length + 1}`;
      const newActor = {
        name: defaultName,
        availableTimeslots: [],
        scenes: []
        // Note: No ID field - MongoDB will generate its own ObjectId
      };
      
      console.log('🎭 Creating actor with data:', newActor);
      const createdActor = await ApiService.createActor(newActor);
      const updatedActors = [...actors, createdActor];
      setActors(updatedActors);
      console.log('✅ Actor added successfully');
    } catch (error) {
      console.error('❌ Error adding actor:', error);
      throw error;
    }
  };

  const handleAddRehearsal = async (rehearsal: any) => {
    try {
      console.log('🎭 Adding rehearsal to backend:', rehearsal);
      const savedRehearsal = await ApiService.createRehearsal(rehearsal);
      const updatedRehearsals = [...rehearsals, savedRehearsal];
      setRehearsals(updatedRehearsals);
      console.log('✅ Rehearsal saved to backend successfully');
    } catch (error) {
      console.error('❌ Error saving rehearsal to backend:', error);
      // Fallback to local storage for now
      const updatedRehearsals = [...rehearsals, rehearsal];
      setRehearsals(updatedRehearsals);
      throw error;
    }
  };

  const handleAddMultipleRehearsals = async (newRehearsals: any[]) => {
    try {
      console.log('🎭 Adding multiple rehearsals to backend:', newRehearsals.length);
      const savedRehearsals = await Promise.all(
        newRehearsals.map(rehearsal => ApiService.createRehearsal(rehearsal))
      );
      const updatedRehearsals = [...rehearsals, ...savedRehearsals];
      setRehearsals(updatedRehearsals);
      console.log('✅ Multiple rehearsals saved to backend successfully');
    } catch (error) {
      console.error('❌ Error saving multiple rehearsals to backend:', error);
      // Fallback to local storage for now
      const updatedRehearsals = [...rehearsals, ...newRehearsals];
      setRehearsals(updatedRehearsals);
      throw error;
    }
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
    handleAddRehearsal,
    handleAddMultipleRehearsals,
    loadData,
    isLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
