import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';
import MultiSelect from './MultiSelect'; // Assuming this component exists

const SceneEditModal = ({ scene, visible, onSave, onCancel, allActors }) => {
  const [editedTitle, setEditedTitle] = useState(scene?.title || '');
  const [editedDescription, setEditedDescription] = useState(scene?.description || '');
  const [selectedActorIds, setSelectedActorIds] = useState(scene?.actorsRequired || []);

  React.useEffect(() => {
    if (scene) {
      setEditedTitle(scene.title);
      setEditedDescription(scene.description);
      setSelectedActorIds(scene.actorsRequired || []);
    }
  }, [scene]);

  const handleSave = () => {
    if (editedTitle.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSave({
        ...scene,
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        actorsRequired: selectedActorIds,
      });
    }
  };

  if (!visible || !scene) return null;

  return (
    <View style={commonStyles.modalOverlay}>
      <View style={commonStyles.modalContent}>
        <ScrollView>
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

          <Text style={styles.inputLabel}>Actors in this Scene:</Text>
          <MultiSelect
            items={allActors.map(actor => ({ id: actor.id, name: actor.name }))}
            selectedItems={selectedActorIds}
            onSelectedItemsChange={setSelectedActorIds}
            selectText="Select actors"
            searchInputPlaceholderText="Search actors..."
          />

          <View style={commonStyles.modalButtons}>
            <TouchableOpacity style={commonStyles.cancelButton} onPress={onCancel}>
              <Text style={commonStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={commonStyles.saveButton} onPress={handleSave}>
              <Text style={commonStyles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
