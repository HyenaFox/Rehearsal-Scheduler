import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';
import TimeslotEditModal from '../components/TimeslotEditModal';
import { useApp } from '../contexts/AppContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';

const TimeslotsScreen = ({ onBack }) => {
  const { timeslots, setTimeslots, actors, setActors } = useApp();
  const [editingTimeslot, setEditingTimeslot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const handleDeleteTimeslot = async (timeslotToDelete) => {
    try {
      await ApiService.deleteTimeslot(timeslotToDelete.id || timeslotToDelete._id);
      const updatedTimeslots = timeslots.filter(t => (t.id || t._id) !== (timeslotToDelete.id || timeslotToDelete._id));
      setTimeslots(updatedTimeslots);
      
      // Remove timeslot from all actors who had it
      const timeslotId = timeslotToDelete.id || timeslotToDelete._id;
      const updatedActors = actors.map(actor => ({
        ...actor,
        availableTimeslots: actor.availableTimeslots.filter(tsId => tsId !== timeslotId)
      }));
      setActors(updatedActors);
      
      console.log('✅ Timeslot deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting timeslot:', error);
      Alert.alert('Error', 'Failed to delete timeslot');
    }
  };

  const handleAddTimeslot = async () => {
    try {
      const newTimeslot = {
        label: 'New Timeslot',
        day: 'Monday',
        startTime: '9:00 AM',
        endTime: '11:00 AM',
        description: ''
      };
      
      const createdTimeslot = await ApiService.createTimeslot(newTimeslot);
      const updatedTimeslots = [...timeslots, createdTimeslot];
      setTimeslots(updatedTimeslots);
      console.log('✅ Timeslot created successfully');
    } catch (error) {
      console.error('❌ Error creating timeslot:', error);
      Alert.alert('Error', 'Failed to create timeslot');
    }
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

          <ScrollView style={{ flex: 1 }}>
            {timeslots.map(timeslot => (
              <Card
                key={timeslot.id}
                title={timeslot.label}
                sections={[
                  {
                    title: 'Day',
                    content: timeslot.day
                  },
                  {
                    title: 'Time',
                    content: `${timeslot.startTime} - ${timeslot.endTime}`
                  },
                  {
                    title: 'Actors Available',
                    content: actors.filter(actor => 
                      actor.availableTimeslots && actor.availableTimeslots.includes(timeslot.id || timeslot._id)
                    ).map(actor => actor.name).join(', ') || 'No actors available'
                  }
                ]}
                onEdit={() => {
                  setEditingTimeslot(timeslot);
                  setShowEditModal(true);
                }}
                onDelete={() => handleDeleteTimeslot(timeslot)}
              />
            ))}
            {timeslots.length === 0 && (
              <View style={commonStyles.emptyState}>
                <Text style={commonStyles.emptyStateText}>No timeslots available</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Timeslot Edit Modal */}
        <TimeslotEditModal
          timeslot={editingTimeslot}
          visible={showEditModal}
          onSave={async (updatedTimeslot) => {
            try {
              const savedTimeslot = await ApiService.updateTimeslot(updatedTimeslot.id || updatedTimeslot._id, updatedTimeslot);
              const updatedTimeslots = timeslots.map(t => 
                (t.id || t._id) === (updatedTimeslot.id || updatedTimeslot._id) ? savedTimeslot : t
              );
              
              setTimeslots(updatedTimeslots);
              setShowEditModal(false);
              setEditingTimeslot(null);
              console.log('✅ Timeslot updated successfully');
            } catch (error) {
              console.error('❌ Error updating timeslot:', error);
              Alert.alert('Error', 'Failed to update timeslot');
            }
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingTimeslot(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default TimeslotsScreen;
