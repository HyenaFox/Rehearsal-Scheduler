import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import ActorEditModal from '../components/ActorEditModal';
import Card from '../components/Card';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { getAvailableTimeslots, getScenes } from '../utils/actorUtils';

export default function ActorsScreen() {
  const { actors, setActors, handleDeleteActor, handleAddActor } = useApp();
  const { user } = useAuth();
  
  // Admin check
  const isAdmin = user?.isAdmin || false;
  
  // Modal states
  const [actorEditModalVisible, setActorEditModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);

  const handleEditActor = (actor: any) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can edit actors.');
      return;
    }
    setSelectedActor(actor);
    setActorEditModalVisible(true);
  };

  const handleSaveActor = async (editedActor: any) => {
    try {
      console.log('🔄 Saving actor to backend:', editedActor);
      
      if (!editedActor.id) {
        console.error('❌ Actor ID is missing, cannot update');
        Alert.alert('Error', 'Actor ID is missing, cannot update');
        return;
      }
      
      // Update actor in backend
      await ApiService.updateActor(editedActor.id, {
        name: editedActor.name,
        availableTimeslots: editedActor.availableTimeslots,
        scenes: editedActor.scenes
      });
      
      // Update local state
      const updatedActors = actors.map(actor => 
        actor.id === editedActor.id ? editedActor : actor
      );
      setActors(updatedActors);
      setActorEditModalVisible(false);
      setSelectedActor(null);
      
      console.log('✅ Actor updated successfully');
    } catch (error) {
      console.error('❌ Error updating actor:', error);
      Alert.alert('Error', 'Failed to update actor');
    }
  };

  const handleCancelActorEdit = () => {
    setActorEditModalVisible(false);
    setSelectedActor(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>👥 Actors</Text>
          
          {isAdmin && (
            <ActionButton 
              title="Add New Actor" 
              onPress={() => {
                if (!isAdmin) {
                  Alert.alert('Access Denied', 'Only administrators can add actors.');
                  return;
                }
                handleAddActor();
              }} 
              style={styles.addButton} 
            />
          )}
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {actors.map(actor => (
              <Card
                key={actor.id}
                title={actor.name}
                sections={[
                  {
                    title: 'Available Timeslots',
                    content: getAvailableTimeslots(actor).map((ts: any) => ts.label).join(', ') || 'No timeslots assigned'
                  },
                  {
                    title: 'Scenes',
                    content: getScenes(actor).join(', ') || 'No scenes assigned'
                  }
                ]}
                onEdit={isAdmin ? () => handleEditActor(actor) : undefined}
                onDelete={isAdmin ? () => {
                  if (!isAdmin) {
                    Alert.alert('Access Denied', 'Only administrators can delete actors.');
                    return;
                  }
                  handleDeleteActor(actor);
                } : undefined}
              />
            ))}
            {actors.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateTitle}>No Actors Yet</Text>
                <Text style={styles.emptyStateText}>
                  {isAdmin ? 'Add your first actor to get started!' : 'No actors have been added to this production.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Actor Edit Modal */}
      <ActorEditModal
        actor={selectedActor}
        visible={actorEditModalVisible}
        onSave={handleSaveActor}
        onCancel={handleCancelActorEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollView: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.4,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});
