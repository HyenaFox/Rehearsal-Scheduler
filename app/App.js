import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from './components/ActionButton';
import ActorEditModal from './components/ActorEditModal';
import AddRehearsalModal from './components/AddRehearsalModal';
import Card from './components/Card';
import RehearsalsDisplay from './components/RehearsalsDisplay';
import ScenesScreen from './screens/ScenesScreen';
import TimeslotsScreen from './screens/TimeslotsScreen';
import { commonStyles } from './styles/common';
import { STORAGE_KEYS } from './types/index';
import { createActor, getAvailableTimeslots, getScenes } from './utils/actorUtils';

const App = () => {
  const [actors, setActors] = useState([]);
  const [rehearsals, setRehearsals] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('actors'); // 'actors' | 'scenes' | 'timeslots' | 'rehearsals'
  
  // Modal states
  const [actorEditModalVisible, setActorEditModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [addRehearsalModalVisible, setAddRehearsalModalVisible] = useState(false);

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
  const handleDeleteRehearsal = (index) => {
    const updatedRehearsals = rehearsals.filter((_, i) => i !== index);
    setRehearsals(updatedRehearsals);
  };
  const handleAddActor = () => {
    // For now, create a default actor - in a real app, you'd want a proper modal
    const newId = Date.now().toString();
    const defaultName = `Actor ${actors.length + 1}`;
    const newActor = createActor(newId, defaultName, [], []);
    const updatedActors = [...actors, newActor];
    setActors(updatedActors);
    
    // Show confirmation
    Alert.alert(
      'Actor Added',
      `"${defaultName}" has been added. You can edit the name by tapping the Edit button.`,
      [{ text: 'OK' }]
    );
  };
  const handleEditActor = (actor) => {
    setSelectedActor(actor);
    setActorEditModalVisible(true);
  };

  const handleSaveActor = (editedActor) => {
    const updatedActors = actors.map(actor => 
      actor.id === editedActor.id ? editedActor : actor
    );
    setActors(updatedActors);
    setActorEditModalVisible(false);
    setSelectedActor(null);
  };

  const handleCancelActorEdit = () => {
    setActorEditModalVisible(false);
    setSelectedActor(null);
  };

  const handleDeleteActor = (actor) => {
    Alert.alert(
      'Delete Actor',
      `Are you sure you want to delete "${actor.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedActors = actors.filter(a => a.id !== actor.id);
            setActors(updatedActors);
          }
        }
      ]
    );
  };
  const handleAddRehearsal = () => {
    setAddRehearsalModalVisible(true);
  };

  const handleSaveRehearsal = (newRehearsal) => {
    const updatedRehearsals = [...rehearsals, newRehearsal];
    setRehearsals(updatedRehearsals);
    setAddRehearsalModalVisible(false);
  };

  const handleCancelAddRehearsal = () => {
    setAddRehearsalModalVisible(false);
  };

  // Show individual screens
  if (currentScreen === 'scenes') {
    return (
      <ScenesScreen 
        onBack={() => setCurrentScreen('actors')}
        actors={actors}
        setActors={setActors}
      />
    );
  }

  if (currentScreen === 'timeslots') {
    return (
      <TimeslotsScreen 
        onBack={() => setCurrentScreen('actors')}
        actors={actors}
        setActors={setActors}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Navigation Header */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={[styles.navButton, currentScreen === 'actors' && styles.activeNavButton]}
            onPress={() => setCurrentScreen('actors')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'actors' && styles.activeNavButtonText]}>Actors</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, currentScreen === 'scenes' && styles.activeNavButton]}
            onPress={() => setCurrentScreen('scenes')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'scenes' && styles.activeNavButtonText]}>Scenes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, currentScreen === 'timeslots' && styles.activeNavButton]}
            onPress={() => setCurrentScreen('timeslots')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'timeslots' && styles.activeNavButtonText]}>Timeslots</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, currentScreen === 'rehearsals' && styles.activeNavButton]}
            onPress={() => setCurrentScreen('rehearsals')}
          >
            <Text style={[styles.navButtonText, currentScreen === 'rehearsals' && styles.activeNavButtonText]}>Rehearsals</Text>
          </TouchableOpacity>
        </View>

        {/* Screen Content */}
        <View style={styles.content}>          {currentScreen === 'actors' && (
            <>
              <Text style={styles.screenTitle}>Actors</Text>
              <ActionButton title="Add Actor" onPress={handleAddActor} />
              <ScrollView style={styles.scrollView}>
                {actors.map(actor => (
                  <Card
                    key={actor.id}
                    title={actor.name}
                    sections={[
                      {
                        title: 'Available Timeslots',
                        content: getAvailableTimeslots(actor).map(ts => ts.label).join(', ') || 'No timeslots assigned'
                      },
                      {
                        title: 'Scenes',
                        content: getScenes(actor).join(', ') || 'No scenes assigned'
                      }
                    ]}
                    onEdit={() => handleEditActor(actor)}
                    onDelete={() => handleDeleteActor(actor)}
                  />
                ))}
                {actors.length === 0 && (
                  <View style={commonStyles.emptyState}>
                    <Text style={commonStyles.emptyStateText}>No actors available</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}          {currentScreen === 'rehearsals' && (
            <>
              <Text style={styles.screenTitle}>Rehearsals</Text>
              <ActionButton title="Add Rehearsal" onPress={handleAddRehearsal} />
              <RehearsalsDisplay
                rehearsals={rehearsals}
                onDeleteRehearsal={handleDeleteRehearsal}
              />
            </>
          )}        </View>
      </View>

      {/* Modals */}
      <ActorEditModal
        actor={selectedActor}
        visible={actorEditModalVisible}
        onSave={handleSaveActor}
        onCancel={handleCancelActorEdit}
      />
      
      <AddRehearsalModal
        visible={addRehearsalModalVisible}
        onSave={handleSaveRehearsal}
        onCancel={handleCancelAddRehearsal}
        actors={actors}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  activeNavButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeNavButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;
