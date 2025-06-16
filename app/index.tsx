// Seth Haycock-Poller
// sethhp@brandeis.edu
// links: https://brandeis.zoom.us/rec/share/GyGHms6WP2_q8S_SJ6QEHNfuS33-gcVuerFyStADEmC9s4gjYNJXftrdOdGGJlI.n1AuguXYc6NyN2Sk?startTime=1750031280000
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

// --- Mock Data ---
// In a real application, this data would come from an API or a state management store.
const actors = [
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
  // Placeholder functions for button presses
  const handleScheduleRehearsal = () => {
    console.log('Schedule Rehearsal button pressed');
  };

  const handleAddActor = () => {
    console.log('Add Actor button pressed');
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

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7', // A light grey-blue background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c313a', // Dark slate color
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4682B4', // Steel Blue
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
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
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
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
});

export default App;