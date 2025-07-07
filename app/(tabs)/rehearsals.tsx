import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import ActorEditModal from '../components/ActorEditModal';
import Card from '../components/Card';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';
import { getAvailableTimeslots, getScenes } from '../utils/actorUtils';

export default function ActorsScreen() {
  const { actors, setActors, handleDeleteActor, handleAddActor, timeslots, scenes } = useApp();
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
    <SafeAreaView style={commonStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={commonStyles.contentContainer}>
        <View style={commonStyles.headerSection}>
          <View style={commonStyles.screenTitleContainer}>
            <Text style={commonStyles.screenTitle}>🎭 Actors</Text>
          </View>
          {isAdmin && (
            <ActionButton 
              title="➕ Add New Actor" 
              onPress={() => {
                if (!isAdmin) {
                  Alert.alert('Access Denied', 'Only administrators can add actors.');
                  return;
                }
                handleAddActor();
              }} 
              style={undefined} 
            />
          )}
        </View>
        
        <ScrollView 
          style={commonStyles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {actors.length === 0 ? (
            <View style={commonStyles.emptyState}>
              <Text style={commonStyles.emptyStateText}>
                No actors added yet.{isAdmin ? ' Tap "Add New Actor" to get started!' : ''}
              </Text>
            </View>
          ) : (
            actors.map(actor => (
              <Card
                key={actor.id}
                title={actor.name}
                sections={[
                  {
                    title: 'Available Timeslots',
                    content: getAvailableTimeslots(actor, timeslots).map((ts: any) => `${ts.startTime} - ${ts.endTime}`).join(', ') || 'No timeslots assigned'
                  },
                  {
                    title: 'Scenes',
                    content: getScenes(actor, scenes).map((scene: any) => scene.title).join(', ') || 'No scenes assigned'
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
            ))
          )}
        </ScrollView>
      </View>

      {/* Modals */}
      <ActorEditModal
        actor={selectedActor}
        visible={actorEditModalVisible}
        onSave={handleSaveActor}
        onCancel={handleCancelActorEdit}
      />
    </SafeAreaView>
  );
}
