import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { commonStyles } from '../styles/common';
import AvailabilityCalendar from './AvailabilityCalendar';

const ActorEditModal = ({ actor, visible, onSave, onCancel }) => {
  const { scenes } = useApp();
  const [editedName, setEditedName] = useState(actor?.name || '');
  const [availability, setAvailability] = useState(actor?.availability || []);
  const [selectedScenes, setSelectedScenes] = useState(actor?.scenes || []);

  React.useEffect(() => {
    if (actor) {
      setEditedName(actor.name);
      setAvailability(actor.availability || []);
      setSelectedScenes(actor.scenes || []);
    }
  }, [actor]);

  const handleTimeSlotSelect = (day, hour, minute) => {
    // Convert to date and add to availability (same logic as ProfileScreen)
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + day);
    date.setHours(hour, minute, 0, 0);
    const newSlot = date.toISOString();
    
    // Toggle the slot
    const isAlreadySelected = availability.includes(newSlot);
    const updatedAvailability = isAlreadySelected 
      ? availability.filter(slot => slot !== newSlot)
      : [...availability, newSlot];
    
    setAvailability(updatedAvailability);
  };

  const toggleScene = (sceneId) => {
    if (selectedScenes.includes(sceneId)) {
      setSelectedScenes(selectedScenes.filter(id => id !== sceneId));
    } else {
      setSelectedScenes([...selectedScenes, sceneId]);
    }
  };

  const handleSave = () => {
    if (editedName.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSave({
        ...actor,
        name: editedName.trim(),
        availability: availability,
        scenes: selectedScenes
      });
    }
  };

  if (!visible || !actor) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={commonStyles.modalOverlay}>
        <View style={[commonStyles.modalContent, { maxHeight: '90%', width: '95%' }]}>
          <ScrollView>
            <Text style={commonStyles.modalTitle}>Edit Actor</Text>
            
            <Text style={styles.inputLabel}>Actor Name:</Text>
            <TextInput
              style={commonStyles.textInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Actor name"
            />

            <Text style={styles.sectionTitle}>Weekly Availability:</Text>
            <AvailabilityCalendar
              selectedSlots={availability}
              onTimeSlotSelect={handleTimeSlotSelect}
            />

            <Text style={styles.sectionTitle}>Scenes:</Text>
            {scenes && scenes.length > 0 ? (
              scenes.map(scene => {
                const sceneId = scene.id || scene._id;
                const isSelected = selectedScenes.includes(sceneId);
                return (
                  <TouchableOpacity
                    key={sceneId}
                    style={[
                      styles.checkboxItem,
                      isSelected && styles.checkboxItemSelected
                    ]}
                    onPress={() => toggleScene(sceneId)}
                  >
                    <Text style={[
                      styles.checkboxText,
                      isSelected && styles.checkboxTextSelected
                    ]}>
                      {isSelected ? '✓' : '○'} {scene.title}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No scenes available</Text>
            )}
          </ScrollView>

          <View style={commonStyles.modalButtons}>
            <TouchableOpacity style={commonStyles.cancelButton} onPress={onCancel}>
              <Text style={commonStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={commonStyles.saveButton} onPress={handleSave}>
              <Text style={commonStyles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  checkboxItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  checkboxText: {
    fontSize: 14,
    color: '#666',
  },
  checkboxTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
};

export default ActorEditModal;
