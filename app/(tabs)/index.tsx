import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import ActorEditModal from '../components/ActorEditModal';
import Card from '../components/Card';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storage';
import { commonStyles } from '../styles/common';
import { GLOBAL_TIMESLOTS } from '../types/index';
import { createActor } from '../utils/actorUtils';

export default function ActorsScreen() {
  const { currentUser, users } = useAuth();
  const { actors, setActors, handleDeleteActor, handleAddActor, handleUpdateActor } = useApp();
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actorToEdit, setActorToEdit] = useState<any>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      const profiles = [];
      for (const user of users) {
        const profile = await StorageService.loadUserProfile(user.id);
        if (profile) {
          profiles.push({
            ...user,
            profile
          });
        }
      }
      setUserProfiles(profiles);
    };
    
    loadProfiles();
  }, [users]);

  const getTimeslotLabels = (timeslotIds: string[]) => {
    return GLOBAL_TIMESLOTS
      .filter(ts => timeslotIds.includes(ts.id))
      .map(ts => ts.label)
      .join(', ') || 'No availability set';
  };

  const handleAddMyself = async () => {
    if (!currentUser) return;
    
    try {
      // Check if user already exists in actors list
      const existingActor = actors.find(actor => actor.id === currentUser.id);
      if (existingActor) {
        Alert.alert('Already Added', 'You are already in the cast list!');
        return;
      }

      // Get user profile
      const userProfile = await StorageService.loadUserProfile(currentUser.id);
      if (!userProfile) {
        Alert.alert(
          'Profile Required', 
          'Please complete your profile first by going to the Profile tab.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Create actor from user profile
      const newActor = createActor(
        currentUser.id,
        userProfile.displayName,
        userProfile.availableTimeslots || [],
        userProfile.scenes || []
      );

      const updatedActors = [...actors, newActor];
      setActors(updatedActors);

      Alert.alert(
        'Added Successfully!', 
        `You've been added to the cast as "${userProfile.displayName}".`
      );
    } catch (error) {
      console.error('Error adding myself:', error);
      Alert.alert('Error', 'Failed to add yourself to the cast.');
    }
  };

  const canAddMyself = currentUser && !actors.some(actor => actor.id === currentUser.id);

  const handleEditActor = (actor: any) => {
    setActorToEdit(actor);
    setEditModalVisible(true);
  };

  const handleSaveActor = (updatedActor: any) => {
    handleUpdateActor(updatedActor);
    setEditModalVisible(false);
    setActorToEdit(null);
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setActorToEdit(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>🎭 Cast & Crew</Text>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {canAddMyself && (
              <ActionButton 
                title="Add Myself to Cast" 
                onPress={handleAddMyself} 
                style={[styles.actionButton, { backgroundColor: '#10b981' }]} 
              />
            )}
            {currentUser?.isAdmin && (
              <ActionButton 
                title="Add Actor (Admin)" 
                onPress={handleAddActor} 
                style={[styles.actionButton, { backgroundColor: '#6366f1' }]} 
              />
            )}
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Current Cast */}
            {actors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Current Cast</Text>
                {actors.map(actor => {
                  const isCurrentUser = currentUser?.id === actor.id;
                  return (
                    <Card
                      key={actor.id}
                      title={`${actor.name}${isCurrentUser ? ' (You)' : ''}`}
                      sections={[
                        {
                          title: 'Available Timeslots',
                          content: getTimeslotLabels(actor.availableTimeslots)
                        },
                        {
                          title: 'Scenes',
                          content: actor.scenes.join(', ') || 'No scenes assigned'
                        }
                      ]}
                      onEdit={currentUser?.isAdmin ? () => handleEditActor(actor) : undefined}
                      onDelete={currentUser?.isAdmin || isCurrentUser ? () => handleDeleteActor(actor) : undefined}
                    />
                  );
                })}
              </View>
            )}

            {/* All Users */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 All Users</Text>
              {userProfiles.length === 0 ? (
                <View style={commonStyles.emptyState}>
                  <Text style={commonStyles.emptyStateText}>No user profiles found</Text>
                </View>
              ) : (
                userProfiles.map(userWithProfile => {
                  const isCurrentUser = currentUser?.id === userWithProfile.id;
                  const isInCast = actors.some(actor => actor.id === userWithProfile.id);
                  
                  return (                    <Card
                      key={userWithProfile.id}
                      title={`${userWithProfile.profile.displayName}${isCurrentUser ? ' (You)' : ''}${userWithProfile.isAdmin ? ' 👑' : ''}`}
                      sections={[
                        {
                          title: 'Username',
                          content: `@${userWithProfile.username}`
                        },
                        {
                          title: 'Status',
                          content: isInCast ? '✅ In Cast' : '⏳ Not in Cast'
                        },
                        {
                          title: 'Available Timeslots',
                          content: getTimeslotLabels(userWithProfile.profile.availableTimeslots || [])
                        },
                        {
                          title: 'Scenes',
                          content: userWithProfile.profile.scenes?.join(', ') || 'No scenes assigned'
                        }
                      ]}
                      onEdit={undefined}
                      onDelete={undefined}
                    />
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Actor Edit Modal */}
          {editModalVisible && actorToEdit && (
            <ActorEditModal
              visible={editModalVisible}
              actor={actorToEdit}
              onSave={handleSaveActor}
              onCancel={handleCancelEdit}
            />
          )}
        </View>
      </View>
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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
});
