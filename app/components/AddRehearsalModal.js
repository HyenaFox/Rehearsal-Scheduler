import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';
import { GLOBAL_TIMESLOTS } from '../types/index';
import { getActorsAvailableForTimeslot } from '../utils/actorUtils';

const AddRehearsalModal = ({ visible, onSave, onCancel, actors }) => {
  const [rehearsalTitle, setRehearsalTitle] = useState('');
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [selectedActors, setSelectedActors] = useState([]);

  const handleTimeslotSelect = (timeslot) => {
    setSelectedTimeslot(timeslot);
    // Reset selected actors when timeslot changes
    setSelectedActors([]);
  };

  const toggleActor = (actor) => {
    if (selectedActors.find(a => a.id === actor.id)) {
      setSelectedActors(selectedActors.filter(a => a.id !== actor.id));
    } else {
      setSelectedActors([...selectedActors, actor]);
    }
  };

  const handleSave = () => {
    if (!rehearsalTitle.trim()) {
      Alert.alert('Error', 'Please enter a rehearsal title.');
      return;
    }
    
    if (!selectedTimeslot) {
      Alert.alert('Error', 'Please select a timeslot.');
      return;
    }
    
    if (selectedActors.length === 0) {
      Alert.alert('Error', 'Please select at least one actor.');
      return;
    }

    const newRehearsal = {
      id: Date.now().toString(),
      title: rehearsalTitle.trim(),
      timeslot: selectedTimeslot,
      actors: selectedActors,
      date: new Date().toISOString(),
    };

    onSave(newRehearsal);
    
    // Reset form
    setRehearsalTitle('');
    setSelectedTimeslot(null);
    setSelectedActors([]);
  };

  const handleCancel = () => {
    // Reset form
    setRehearsalTitle('');
    setSelectedTimeslot(null);
    setSelectedActors([]);
    onCancel();
  };

  const availableActors = selectedTimeslot 
    ? getActorsAvailableForTimeslot(actors, selectedTimeslot.id)
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={commonStyles.modalOverlay}>
        <View style={[commonStyles.modalContent, { maxHeight: '90%', width: '95%' }]}>
          <ScrollView>
            <Text style={commonStyles.modalTitle}>Add Rehearsal</Text>
            
            <Text style={styles.inputLabel}>Rehearsal Title:</Text>
            <TextInput
              style={commonStyles.textInput}
              value={rehearsalTitle}
              onChangeText={setRehearsalTitle}
              placeholder="Enter rehearsal title"
            />

            <Text style={styles.sectionTitle}>Select Timeslot:</Text>
            {GLOBAL_TIMESLOTS.map(timeslot => (
              <TouchableOpacity
                key={timeslot.id}
                style={[
                  styles.selectItem,
                  selectedTimeslot?.id === timeslot.id && styles.selectItemSelected
                ]}
                onPress={() => handleTimeslotSelect(timeslot)}
              >
                <Text style={[
                  styles.selectText,
                  selectedTimeslot?.id === timeslot.id && styles.selectTextSelected
                ]}>
                  {selectedTimeslot?.id === timeslot.id ? '●' : '○'} {timeslot.label}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedTimeslot && (
              <>
                <Text style={styles.sectionTitle}>
                  Select Actors (Available: {availableActors.length}):
                </Text>
                {availableActors.length === 0 ? (
                  <Text style={styles.noActorsText}>
                    No actors are available for this timeslot
                  </Text>
                ) : (
                  availableActors.map(actor => (
                    <TouchableOpacity
                      key={actor.id}
                      style={[
                        styles.checkboxItem,
                        selectedActors.find(a => a.id === actor.id) && styles.checkboxItemSelected
                      ]}
                      onPress={() => toggleActor(actor)}
                    >
                      <Text style={[
                        styles.checkboxText,
                        selectedActors.find(a => a.id === actor.id) && styles.checkboxTextSelected
                      ]}>
                        {selectedActors.find(a => a.id === actor.id) ? '✓' : '○'} {actor.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>

          <View style={commonStyles.modalButtons}>
            <TouchableOpacity style={commonStyles.cancelButton} onPress={handleCancel}>
              <Text style={commonStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={commonStyles.saveButton} onPress={handleSave}>
              <Text style={commonStyles.saveButtonText}>Add Rehearsal</Text>
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
  selectItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  selectText: {
    fontSize: 14,
    color: '#666',
  },
  selectTextSelected: {
    color: '#007bff',
    fontWeight: '600',
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
  noActorsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
};

export default AddRehearsalModal;
