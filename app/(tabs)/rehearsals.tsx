import { useState, useEffect } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import ActionButton from '../components/ActionButton';
import ActorEditModal from '../components/ActorEditModal';
import AddRehearsalModal from '../components/AddRehearsalModal';
import RehearsalsDisplay from '../components/RehearsalsDisplay';
import Card from '../components/Card';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';
import { getAvailableTimeslots, getScenes } from '../utils/actorUtils';

export default function RehearsalsScreen() {
  const { actors, setActors, handleDeleteActor, handleAddActor } = useApp();
  const { user } = useAuth();
  
  // Admin check
  const isAdmin = user?.isAdmin || false;
  
  // Modal states
  const [actorEditModalVisible, setActorEditModalVisible] = useState(false);
  const [addRehearsalModalVisible, setAddRehearsalModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('rehearsals'); // 'rehearsals' or 'actors'

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

  const handleAddRehearsal = (newRehearsal: any) => {
    setRehearsals([...rehearsals, newRehearsal]);
    setAddRehearsalModalVisible(false);
  };

  const handleDeleteRehearsal = (index: number) => {
    Alert.alert(
      'Delete Rehearsal',
      'Are you sure you want to delete this rehearsal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedRehearsals = rehearsals.filter((_, i) => i !== index);
            setRehearsals(updatedRehearsals);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>🎭 Shows & Rehearsals</Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'rehearsals' && styles.activeTab]}
              onPress={() => setActiveTab('rehearsals')}
            >
              <Text style={[styles.tabText, activeTab === 'rehearsals' && styles.activeTabText]}>
                📅 Rehearsals
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'actors' && styles.activeTab]}
              onPress={() => setActiveTab('actors')}
            >
              <Text style={[styles.tabText, activeTab === 'actors' && styles.activeTabText]}>
                👥 Actors
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'rehearsals' ? (
            <View style={styles.tabContent}>
              {isAdmin && (
                <ActionButton 
                  title="Schedule New Rehearsal" 
                  onPress={() => setAddRehearsalModalVisible(true)}
                  style={styles.primaryButton} 
                />
              )}
              
              <RehearsalsDisplay 
                rehearsals={rehearsals}
                onDeleteRehearsal={handleDeleteRehearsal}
                isAdmin={isAdmin}
              />
              
              {rehearsals.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateIcon}>📅</Text>
                  <Text style={styles.emptyStateTitle}>No Rehearsals Scheduled</Text>
                  <Text style={styles.emptyStateText}>
                    {isAdmin ? 'Create your first rehearsal to get started!' : 'Check back later for scheduled rehearsals.'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
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
                  style={styles.secondaryButton} 
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
          )}
        </View>
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
        onSave={handleAddRehearsal}
        onCancel={() => setAddRehearsalModalVisible(false)}
        actors={actors}
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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#1e293b',
  },
  tabContent: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: '#10b981',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
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
