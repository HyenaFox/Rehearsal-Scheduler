import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import AutoPopulateModal from '../components/AutoPopulateModal';
import Card from '../components/Card';
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
  const [isAutoPopulateModalVisible, setIsAutoPopulateModalVisible] = useState(false);
  
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

  const handleAutoPopulate = async (startTime, endTime) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can auto-populate timeslots.');
      return;
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const newTimeslots = [];

    days.forEach(day => {
      let current = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);

      while (current < end) {
        const next = new Date(current.getTime() + 30 * 60000);
        if (next > end) break;

        newTimeslots.push({
          day,
          startTime: current.toTimeString().substring(0, 5),
          endTime: next.toTimeString().substring(0, 5),
          description: 'Auto-populated',
        });
        current = next;
      }
    });

    try {
      const createdTimeslots = await ApiService.createTimeslotsBulk(newTimeslots);
      setTimeslots(prev => [...prev, ...createdTimeslots]);
      console.log('✅ Timeslots auto-populated successfully');
    } catch (error) {
      console.error('❌ Error auto-populating timeslots:', error);
      Alert.alert('Error', 'Failed to auto-populate timeslots');
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
            <>
              <ActionButton title="Add New Timeslot" onPress={handleAddTimeslot} />
              <ActionButton title="Auto-populate Timeslots" onPress={() => setIsAutoPopulateModalVisible(true)} />
            </>
          )}

          <ScrollView style={{ flex: 1 }}>
            {timeslots.map(timeslot => (
              <Card
                key={timeslot.id}
                title={`${timeslot.startTime} - ${timeslot.endTime}`}
                sections={[
                  {
                    title: 'Day',
                    content: timeslot.day
                  },
                  {
                    title: 'Description',
                    content: timeslot.description
                  }
                ]}
                onDelete={() => handleDeleteTimeslot(timeslot)}
                onEdit={() => {
                  setEditingTimeslot(timeslot);
                  setShowEditModal(true);
                }}
                showAdminActions={isAdmin}
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

        {/* Auto-populate Modal */}
        <AutoPopulateModal
          visible={isAutoPopulateModalVisible}
          onClose={() => setIsAutoPopulateModalVisible(false)}
          onPopulate={handleAutoPopulate}
        />
      </View>
    </SafeAreaView>
  );
};

export default TimeslotsScreen;
