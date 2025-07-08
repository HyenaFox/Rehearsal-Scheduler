import { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import TimeslotCalendar from '../components/TimeslotCalendar';
import TimeslotEditModal from '../components/TimeslotEditModal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';

const TimeslotsScreen = ({ onBack }) => {
  const { timeslots, setTimeslots, actors, setActors } = useApp();
  const { user } = useAuth();
  
  // Admin check
  const isAdmin = user?.isAdmin || false;
  
  const [editingTimeslot, setEditingTimeslot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const handleTimeslotMove = async (timeslot, newDay, newStartTime) => {
    if (!isAdmin) return;
    
    try {
      const updatedTimeslot = {
        ...timeslot,
        day: newDay,
        startTime: newStartTime,
        // Keep the same duration
        endTime: calculateEndTime(newStartTime, timeslot.startTime, timeslot.endTime)
      };
      
      const savedTimeslot = await ApiService.updateTimeslot(timeslot.id || timeslot._id, updatedTimeslot);
      const updatedTimeslots = timeslots.map(t => 
        (t.id || t._id) === (timeslot.id || timeslot._id) ? savedTimeslot : t
      );
      
      setTimeslots(updatedTimeslots);
      console.log('✅ Timeslot moved successfully');
    } catch (error) {
      console.error('❌ Error moving timeslot:', error);
      Alert.alert('Error', 'Failed to move timeslot');
    }
  };

  const handleTimeslotResize = async (timeslot, direction, timeChangeMinutes) => {
    if (!isAdmin) return;
    
    try {
      const updatedTimeslot = { ...timeslot };
      
      if (direction === 'start') {
        updatedTimeslot.startTime = adjustTime(timeslot.startTime, timeChangeMinutes);
      } else {
        updatedTimeslot.endTime = adjustTime(timeslot.endTime, timeChangeMinutes);
      }
      
      const savedTimeslot = await ApiService.updateTimeslot(timeslot.id || timeslot._id, updatedTimeslot);
      const updatedTimeslots = timeslots.map(t => 
        (t.id || t._id) === (timeslot.id || timeslot._id) ? savedTimeslot : t
      );
      
      setTimeslots(updatedTimeslots);
      console.log('✅ Timeslot resized successfully');
    } catch (error) {
      console.error('❌ Error resizing timeslot:', error);
      Alert.alert('Error', 'Failed to resize timeslot');
    }
  };

  // Helper function to calculate end time when moving
  const calculateEndTime = (newStartTime, oldStartTime, oldEndTime) => {
    // Calculate duration and apply to new start time
    const oldStartMinutes = timeToMinutes(oldStartTime);
    const oldEndMinutes = timeToMinutes(oldEndTime);
    const duration = oldEndMinutes - oldStartMinutes;
    const newStartMinutes = timeToMinutes(newStartTime);
    return minutesToTime(newStartMinutes + duration);
  };

  // Helper function to adjust time by minutes
  const adjustTime = (timeStr, minutesChange) => {
    const minutes = timeToMinutes(timeStr);
    return minutesToTime(Math.max(0, minutes + minutesChange));
  };

  // Helper functions for time conversion
  const timeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    return hour24 * 60 + (minutes || 0);
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const handleDeleteTimeslot = async (timeslotToDelete) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can delete timeslots.');
      return;
    }
    
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
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can add timeslots.');
      return;
    }
    
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
          {isAdmin && (
            <ActionButton title="Add New Timeslot" onPress={handleAddTimeslot} />
          )}

          <TimeslotCalendar 
            timeslots={timeslots} 
            isAdmin={isAdmin}
            isDraggable={isAdmin}
            onTimeslotUpdate={(updatedTimeslot) => {
              setEditingTimeslot(updatedTimeslot);
              setShowEditModal(true);
            }}
            onTimeslotDelete={handleDeleteTimeslot}
            onTimeslotMove={handleTimeslotMove}
            onTimeslotResize={handleTimeslotResize}
          />
          {timeslots.length === 0 && (
            <View style={commonStyles.emptyState}>
              <Text style={commonStyles.emptyStateText}>No timeslots available</Text>
            </View>
          )}
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
