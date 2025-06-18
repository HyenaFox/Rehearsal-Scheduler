// Seth Haycock-Poller
// sethhp@brandeis.edu
// links: https://brandeis.zoom.us/rec/share/GyGHms6WP2_q8S_SJ6QEHNfuS33-gcVuerFyStADEmC9s4gjYNJXftrdOdGGJlI.n1AuguXYc6NyN2Sk?startTime=1750031280000
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  TextInput,
} from 'react-native';

// CLASS BASED APPROACH? VALID FOR REACT?
class Actor {
  constructor(id, name, timeslots, scenes) {
    this.id = id;
    this.name = name;
    this.timeslots = timeslots;
    this.scenes = scenes;
  }

  addTimeSlot(timeslot) {
    this.timeslots.push(timeslot);
  }

  addScene(scene) {
    this.scenes.push(scene);
  }

  removeTimeSlot(timeslot) {
    this.timeslots = this.timeslots.filter(slot => slot !== timeslot);
  }

  removeScene(scene) {
    this.scenes = this.scenes.filter(s => s !== scene);
  }

  isAvailable(time) {
    return this.timeslots.includes(time);
  }

  getScenes() {
    return this.scenes;
  }
}

const createActor = (id, name, timeslots = [], scenes = []) => {
  return new Actor(id, name, timeslots, scenes);
}

// mock CreateActors method for fake data
const createActors = (actorData) => {
  return actorData.map(data =>
    createActor(data.id, data.name, data.timeslots, data.scenes)
  );
}

// --- Mock Data ---
// In a real application, this data would come from an API or a state management store.
const placeholderActorData = [
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

// create actors from mock data
const actors = createActors(actorData);
// --- Components ---

// A reusable button component using TouchableOpacity
const ActionButton = ({ title, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

// Component to display details for a single actor
const ActorCard = ({ actor }) => (
  <View style={styles.card}>
    <Text style={styles.actorName}>{actor.name}</Text>
    <View style={styles.detailContainer}>
      <Text style={styles.detailTitle}>Timeslots:</Text>
      {actor.timeslots.map((slot, index) => (
        <Text key={index} style={styles.detailText}>- {slot}</Text>
      ))}
    </View>
    <View style={styles.detailContainer}>
      <Text style={styles.detailTitle}>Scenes:</Text>
      {actor.scenes.map((scene, index) => (
        <Text key={index} style={styles.detailText}>- {scene}</Text>
      ))}
    </View>
  </View>
);

// The main App component
const App = () => {
   const [actors, setActors] = useState(() => createActors(placeholderActorData));
  const [showAddActorModal, setShowAddActorModal] = useState(false);
  const [newActorName, setNewActorName] = useState('');
 
    // Function to generate unique ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };
  // Placeholder functions for button presses
  const handleScheduleRehearsal = () => {
    console.log('Schedule Rehearsal button pressed');
  };

  const handleAddActor = () => {
    setShowAddActorModal(true);
  };

  const handleConfirmAddActor = () => {
    if (newActorName.trim() === '') {
      Alert.alert('Error', 'Please enter an actor name');
      return;
    }

    const newActor = createActor(
      generateId(),
      newActorName.trim(),
      [], // Empty timeslots initially
      []  // Empty scenes initially
    );

    setActors(prevActors => [...prevActors, newActor]);
    setNewActorName('');
    setShowAddActorModal(false);
    
    Alert.alert('Success', `Actor "${newActorName}" has been added!`);
  };

  const handleCancelAddActor = () => {
    setNewActorName('');
    setShowAddActorModal(false);
  };

  const handleAddTimeslot = () => {
    console.log('Add Timeslot button pressed');
  };

  const handleAddScene = () => {
    console.log('Add Scene button pressed');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Rehearsal Scheduler</Text>

        {/* --- Action Buttons --- */}
        <View style={styles.buttonContainer}>
          <ActionButton title="Schedule Rehearsal" onPress={handleScheduleRehearsal} />
          <ActionButton title="Add Actor" onPress={handleAddActor} />
        </View>
        <View style={styles.buttonContainer}>
          <ActionButton title="Add Timeslots" onPress={handleAddTimeslot} />
          <ActionButton title="Add Scenes" onPress={handleAddScene} />
        </View>

        {/* --- Actor List --- */}
        <ScrollView style={styles.scrollView}>
          {actors.map(actor => (
            <ActorCard key={actor.id} actor={actor} />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

//--- Styles ---
const styles = StyleSheet.create({
  // ...existing styles...
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c313a',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  actorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailContainer: {
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
  // New modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#4682B4',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});


export default App;