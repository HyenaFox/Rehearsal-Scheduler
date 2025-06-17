import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';

import { actors } from '../data/actors';
import { ActionButton } from '../components/ActionButton';
import { ActorCard } from '../components/ActorCard';

export default function HomeScreen() {
  const handleScheduleRehearsal = () => {
    router.push('/schedule-rehearsal');
  };

  const handleAddActor = () => {
    router.push('/add-actor');
  };

  const handleAddTimeslot = () => {
    router.push('/add-timeslot');
  };

  const handleAddScene = () => {
    router.push('/add-scene');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <ActionButton title="Schedule Rehearsal" onPress={handleScheduleRehearsal} />
          <ActionButton title="Add Actor" onPress={handleAddActor} />
        </View>
        <View style={styles.buttonContainer}>
          <ActionButton title="Add Timeslots" onPress={handleAddTimeslot} />
          <ActionButton title="Add Scenes" onPress={handleAddScene} />
        </View>

        <ScrollView style={styles.scrollView}>
          {actors.map(actor => (
            <ActorCard key={actor.id} actor={actor} />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
});