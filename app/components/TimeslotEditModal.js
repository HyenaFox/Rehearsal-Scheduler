import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const TimeslotEditModal = ({ timeslot, visible, onSave, onCancel }) => {
  const [editedLabel, setEditedLabel] = useState(timeslot?.label || '');
  const [editedDay, setEditedDay] = useState(timeslot?.day || '');
  const [editedStartTime, setEditedStartTime] = useState(timeslot?.startTime || '');
  const [editedEndTime, setEditedEndTime] = useState(timeslot?.endTime || '');

  React.useEffect(() => {
    if (timeslot) {
      setEditedLabel(timeslot.label);
      setEditedDay(timeslot.day);
      setEditedStartTime(timeslot.startTime);
      setEditedEndTime(timeslot.endTime);
    }
  }, [timeslot]);

  const handleSave = () => {
    if (editedLabel.trim() && editedDay.trim() && editedStartTime.trim() && editedEndTime.trim()) {
      onSave({
        ...timeslot,
        label: editedLabel.trim(),
        day: editedDay.trim(),
        startTime: editedStartTime.trim(),
        endTime: editedEndTime.trim()
      });
    }
  };

  if (!visible || !timeslot) return null;

  return (
    <View style={commonStyles.modalOverlay}>
      <View style={commonStyles.modalContent}>
        <Text style={commonStyles.modalTitle}>Edit Timeslot</Text>
        
        <Text style={styles.inputLabel}>Timeslot Label:</Text>
        <TextInput
          style={commonStyles.textInput}
          value={editedLabel}
          onChangeText={setEditedLabel}
          placeholder="Timeslot label"
        />

        <Text style={styles.inputLabel}>Day:</Text>
        <TextInput
          style={commonStyles.textInput}
          value={editedDay}
          onChangeText={setEditedDay}
          placeholder="Day of the week"
        />

        <Text style={styles.inputLabel}>Start Time:</Text>
        <TextInput
          style={commonStyles.textInput}
          value={editedStartTime}
          onChangeText={setEditedStartTime}
          placeholder="Start time"
        />

        <Text style={styles.inputLabel}>End Time:</Text>
        <TextInput
          style={commonStyles.textInput}
          value={editedEndTime}
          onChangeText={setEditedEndTime}
          placeholder="End time"
        />

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
  );
};

const styles = {
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
};

export default TimeslotEditModal;
