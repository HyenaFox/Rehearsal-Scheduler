import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Actor {
  id: string;
  name: string;
  timeslots: string[];
  scenes: string[];
}

interface ActorCardProps {
  actor: Actor;
}

export const ActorCard: React.FC<ActorCardProps> = ({ actor }) => (
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

const styles = StyleSheet.create({
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
});