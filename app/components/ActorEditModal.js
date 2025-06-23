import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';
import { GLOBAL_SCENES, GLOBAL_TIMESLOTS } from '../types/index';

const ActorEditModal = ({ actor, visible, onSave, onCancel }) => {
  const [editedName, setEditedName] = useState(actor?.name || '');
  const [selectedTimeslots, setSelectedTimeslots] = useState(actor?.availableTimeslots || []);
  const [selectedScenes, setSelectedScenes] = useState(actor?.scenes || []);

  React.useEffect(() => {
    if (actor) {
      setEditedName(actor.name);
      setSelectedTimeslots(actor.availableTimeslots || []);
      setSelectedScenes(actor.scenes || []);
    }
  }, [actor]);

  const toggleTimeslot = (timeslotId) => {
    if (selectedTimeslots.includes(timeslotId)) {
      setSelectedTimeslots(selectedTimeslots.filter(id => id !== timeslotId));
    } else {
      setSelectedTimeslots([...selectedTimeslots, timeslotId]);
    }
  };

  const toggleScene = (sceneTitle) => {
    if (selectedScenes.includes(sceneTitle)) {
      setSelectedScenes(selectedScenes.filter(title => title !== sceneTitle));
    } else {
      setSelectedScenes([...selectedScenes, sceneTitle]);
    }
  };

  const handleSave = () => {
    if (editedName.trim()) {
      onSave({
        ...actor,
        name: editedName.trim(),
        availableTimeslots: selectedTimeslots,
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

            <Text style={styles.sectionTitle}>Available Timeslots:</Text>
            {GLOBAL_TIMESLOTS.map(timeslot => (
              <TouchableOpacity
                key={timeslot.id}
                style={[
                  styles.checkboxItem,
                  selectedTimeslots.includes(timeslot.id) && styles.checkboxItemSelected
                ]}
                onPress={() => toggleTimeslot(timeslot.id)}
              >
                <Text style={[
                  styles.checkboxText,
                  selectedTimeslots.includes(timeslot.id) && styles.checkboxTextSelected
                ]}>
                  {selectedTimeslots.includes(timeslot.id) ? '✓' : '○'} {timeslot.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Scenes:</Text>
            {GLOBAL_SCENES.map(scene => (
              <TouchableOpacity
                key={scene.id}
                style={[
                  styles.checkboxItem,
                  selectedScenes.includes(scene.title) && styles.checkboxItemSelected
                ]}
                onPress={() => toggleScene(scene.title)}
              >
                <Text style={[
                  styles.checkboxText,
                  selectedScenes.includes(scene.title) && styles.checkboxTextSelected
                ]}>
                  {selectedScenes.includes(scene.title) ? '✓' : '○'} {scene.title}
                </Text>
              </TouchableOpacity>
            ))}
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
};

export default ActorEditModal;
