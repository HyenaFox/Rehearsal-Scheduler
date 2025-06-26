import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SceneEditModal = ({ scene, visible, onSave, onCancel }) => {
  const [editedTitle, setEditedTitle] = useState(scene?.title || '');
  const [editedDescription, setEditedDescription] = useState(scene?.description || '');

  React.useEffect(() => {
    if (scene) {
      setEditedTitle(scene.title || '');
      setEditedDescription(scene.description || '');
    } else {
      // Reset to defaults for new scene
      setEditedTitle('');
      setEditedDescription('');
    }
  }, [scene, visible]);

  const handleSave = () => {
    // Validate required fields
    if (!editedTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a scene title.');
      return;
    }

    // All validation passed, save the scene
    const sceneData = {
      ...scene,
      title: editedTitle.trim(),
      description: editedDescription.trim()
    };
    onSave(sceneData);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {scene?.id ? 'Edit Scene' : 'Add New Scene'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Scene Title:</Text>
            <TextInput
              style={styles.textInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Scene title"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Description:</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Scene description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
              !editedTitle.trim() && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={!editedTitle.trim()}
          >
            <Text style={[
              styles.saveButtonText,
              !editedTitle.trim() && styles.saveButtonTextDisabled
            ]}>
              {scene?.id ? 'Update' : 'Create'}
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
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
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

export default SceneEditModal;
