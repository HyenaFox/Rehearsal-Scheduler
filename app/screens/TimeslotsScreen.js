import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';
import TimeslotEditModal from '../components/TimeslotEditModal';
import { useApp } from '../contexts/AppContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';
import { getActorsAvailableForTimeslot, removeAvailableTimeslot } from '../utils/actorUtils';

const TimeslotsScreen = ({ onBack }) => {
  const { timeslots, setTimeslots, actors, setActors } = useApp();
  const [editingTimeslot, setEditingTimeslot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDeleteTimeslot = async (timeslotId) => {
    try {
      // Delete from API
      await ApiService.deleteTimeslot(timeslotId);
      
      // Remove from local state
      const updatedTimeslots = timeslots.filter(t => t.id !== timeslotId);
      setTimeslots(updatedTimeslots);

      // Remove from all actors (this should ideally be handled by the backend)
      const updatedActors = actors.map(actor => 
        removeAvailableTimeslot(actor, timeslotId)
      );
      setActors(updatedActors);
      
      Alert.alert('Success', 'Timeslot deleted successfully');
    } catch (error) {
      console.error('Failed to delete timeslot:', error);
      Alert.alert('Error', 'Failed to delete timeslot');
    }
  };

  const handleAddTimeslot = () => {
    // Set up for creating a new timeslot
    const newTimeslot = {
      label: 'New Timeslot',
      day: 'Monday',
      startTime: '9:00 AM',
      endTime: '11:00 AM'
    };
    
    setEditingTimeslot(newTimeslot);
    setShowEditModal(true);
  };

  const handleEditTimeslot = (timeslot) => {
    setEditingTimeslot(timeslot);
    setShowEditModal(true);
  };

  const handleSaveTimeslot = async (editedTimeslot) => {
    try {
      let updatedTimeslot;
      
      if (editedTimeslot.id) {
        // Update existing timeslot
        updatedTimeslot = await ApiService.updateTimeslot(editedTimeslot.id, editedTimeslot);
        
        // Update local state
        const updatedTimeslots = timeslots.map(t => 
          t.id === editedTimeslot.id ? updatedTimeslot : t
        );
        setTimeslots(updatedTimeslots);
        
        Alert.alert('Success', 'Timeslot updated successfully');
      } else {
        // Create new timeslot
        updatedTimeslot = await ApiService.createTimeslot(editedTimeslot);
        
        // Add to local state
        const updatedTimeslots = [...timeslots, updatedTimeslot];
        setTimeslots(updatedTimeslots);
        
        Alert.alert('Success', 'Timeslot added successfully');
      }
      
      setShowEditModal(false);
      setEditingTimeslot(null);
    } catch (error) {
      console.error('Failed to save timeslot:', error);
      Alert.alert('Error', 'Failed to save timeslot');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingTimeslot(null);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" />
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
            <Text style={commonStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Manage Timeslots</Text>
        </View>

        <View style={commonStyles.scrollView}>
          <ActionButton title="Add New Timeslot" onPress={handleAddTimeslot} />

          <ScrollView style={commonStyles.scrollView}>
            {(!timeslots || timeslots.length === 0) ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No timeslots available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first timeslot to get started with scheduling rehearsals.
                </Text>
              </View>
            ) : (
              timeslots.map((timeslot) => {
                const availableActors = getActorsAvailableForTimeslot(actors, timeslot.id);
                
                return (
                  <Card
                    key={timeslot.id}
                    title={timeslot.label}
                    subtitle={`${timeslot.day} • ${timeslot.startTime} - ${timeslot.endTime}`}
                    description={`Available actors: ${availableActors.length}`}
                    onEdit={() => handleEditTimeslot(timeslot)}
                    onDelete={() => handleDeleteTimeslot(timeslot.id)}
                  />
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Timeslot Edit Modal */}
        <TimeslotEditModal
          timeslot={editingTimeslot}
          visible={showEditModal}
          onSave={handleSaveTimeslot}
          onCancel={handleCancelEdit}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = {
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
};

export default TimeslotsScreen;
