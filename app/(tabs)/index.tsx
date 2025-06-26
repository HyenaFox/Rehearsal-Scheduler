import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import ActorEditModal from '../components/ActorEditModal';
import Card from '../components/Card';
import { useApp } from '../contexts/AppContext';
import { commonStyles } from '../styles/common';
import { getAvailableTimeslots, getScenes } from '../utils/actorUtils';

export default function ActorsScreen() {
  const { actors, timeslots, scenes, setActors, handleDeleteActor, handleAddActor } = useApp();
  
  // Modal states
  const [actorEditModalVisible, setActorEditModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);

  const handleEditActor = (actor: any) => {
    setSelectedActor(actor);
    setActorEditModalVisible(true);
  };

  const handleSaveActor = (editedActor: any) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>🎭 Actors</Text>
          <ActionButton title="Add Actor" onPress={handleAddActor} style={undefined} />
          <ScrollView style={styles.scrollView}>
            {actors.map(actor => (
              <Card
                key={actor.id}
                title={actor.name}
                sections={[
                  {
                    title: 'Available Timeslots',
                    content: getAvailableTimeslots(actor, timeslots || []).map((ts: any) => ts.label).join(', ') || 'No timeslots assigned'
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
        </View>
      </View>

      {/* Modals */}
      <ActorEditModal
        actor={selectedActor}
        visible={actorEditModalVisible}
        onSave={handleSaveActor}
        onCancel={handleCancelActorEdit}
        timeslots={timeslots}
        scenes={scenes}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
});
