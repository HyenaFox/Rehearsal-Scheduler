import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TimeslotEditModal = ({ timeslot, visible, onSave, onCancel }) => {
  const [editedLabel, setEditedLabel] = useState(timeslot?.label || '');
  const [editedDay, setEditedDay] = useState(timeslot?.day || '');
  const [editedStartTime, setEditedStartTime] = useState(timeslot?.startTime || '');
  const [editedEndTime, setEditedEndTime] = useState(timeslot?.endTime || '');

  React.useEffect(() => {
    if (timeslot) {
      setEditedLabel(timeslot.label || '');
      setEditedDay(timeslot.day || '');
      setEditedStartTime(timeslot.startTime || '');
      setEditedEndTime(timeslot.endTime || '');
    } else {
      // Reset to defaults for new timeslot
      setEditedLabel('');
      setEditedDay('');
      setEditedStartTime('');
      setEditedEndTime('');
    }
  }, [timeslot, visible]);

  const handleSave = () => {
    // Validate required fields
    if (!editedLabel.trim()) {
      Alert.alert('Validation Error', 'Please enter a timeslot label.');
      return;
    }
    if (!editedDay.trim()) {
      Alert.alert('Validation Error', 'Please enter a day of the week.');
      return;
    }
    if (!editedStartTime.trim()) {
      Alert.alert('Validation Error', 'Please enter a start time.');
      return;
    }
    if (!editedEndTime.trim()) {
      Alert.alert('Validation Error', 'Please enter an end time.');
      return;
    }

    // All validation passed, save the timeslot
    const timeslotData = {
      ...timeslot,
      label: editedLabel.trim(),
      day: editedDay.trim(),
      startTime: editedStartTime.trim(),
      endTime: editedEndTime.trim()
    };
    onSave(timeslotData);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {timeslot?.id ? 'Edit Timeslot' : 'Add New Timeslot'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Timeslot Label:</Text>
            <TextInput
              style={styles.textInput}
              value={editedLabel}
              onChangeText={setEditedLabel}
              placeholder="Timeslot label"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Day:</Text>
            <TextInput
              style={styles.textInput}
              value={editedDay}
              onChangeText={setEditedDay}
              placeholder="Day of the week"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Start Time:</Text>
            <TextInput
              style={styles.textInput}
              value={editedStartTime}
              onChangeText={setEditedStartTime}
              placeholder="Start time (e.g., 9:00 AM)"
            />

            <Text style={styles.inputLabel}>End Time:</Text>
            <TextInput
              style={styles.textInput}
              value={editedEndTime}
              onChangeText={setEditedEndTime}
              placeholder="End time (e.g., 11:00 AM)"
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!editedLabel.trim() || !editedDay.trim() || !editedStartTime.trim() || !editedEndTime.trim()) && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={!editedLabel.trim() || !editedDay.trim() || !editedStartTime.trim() || !editedEndTime.trim()}
          >
            <Text style={[
              styles.saveButtonText,
              (!editedLabel.trim() || !editedDay.trim() || !editedStartTime.trim() || !editedEndTime.trim()) && styles.saveButtonTextDisabled
            ]}>
              {timeslot?.id ? 'Update' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366f1',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButtonTextDisabled: {
    color: '#d1d5db',
  },
});

export default TimeslotEditModal;
