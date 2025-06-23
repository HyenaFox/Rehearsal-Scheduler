import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const SceneEditModal = ({ scene, visible, onSave, onCancel }) => {
  const [editedTitle, setEditedTitle] = useState(scene?.title || '');
  const [editedDescription, setEditedDescription] = useState(scene?.description || '');

  React.useEffect(() => {
    if (scene) {
      setEditedTitle(scene.title);
      setEditedDescription(scene.description);
    }
  }, [scene]);

  const handleSave = () => {
    if (editedTitle.trim()) {
      onSave({
        ...scene,
        title: editedTitle.trim(),
        description: editedDescription.trim()
      });
    }
  };

  if (!visible || !scene) return null;

  return (
    <View style={commonStyles.modalOverlay}>
      <View style={commonStyles.modalContent}>
        <Text style={commonStyles.modalTitle}>Edit Scene</Text>
        
        <Text style={styles.inputLabel}>Scene Title:</Text>
        <TextInput
          style={commonStyles.textInput}
          value={editedTitle}
          onChangeText={setEditedTitle}
          placeholder="Scene title"
        />

        <Text style={styles.inputLabel}>Description:</Text>
        <TextInput
          style={[commonStyles.textInput, commonStyles.multilineInput]}
          value={editedDescription}
          onChangeText={setEditedDescription}
          placeholder="Scene description"
          multiline
          numberOfLines={3}
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

export default SceneEditModal;
