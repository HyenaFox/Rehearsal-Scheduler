import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { responsive, getScreenSize } from '../utils/responsive';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface CreatePollModalProps {
  visible: boolean;
  onSave: (pollData: any) => Promise<void>;
  onCancel: () => void;
}

export default function CreatePollModal({ visible, onSave, onCancel }: CreatePollModalProps) {
  const { actors, scenes } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { date: '', startTime: '', endTime: '', description: '' }
  ]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    allowMultipleSelections: true,
    requireAllActors: true,
    showResponsesPublically: true,
    allowComments: true,
    deadline: '',
    timezone: 'UTC'
  });

  const screenSize = getScreenSize();
  const styles = createResponsiveStyles(screenSize);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTimeSlots([{ date: '', startTime: '', endTime: '', description: '' }]);
    setSelectedScenes([]);
    setSelectedActorIds([]);
    setSettings({
      allowMultipleSelections: true,
      requireAllActors: true,
      showResponsesPublically: true,
      allowComments: true,
      deadline: '',
      timezone: 'UTC'
    });
  };

  const useQuickTemplate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    setTitle('Rehearsal Availability Poll');
    setDescription('Please let us know your availability for upcoming rehearsals');
    setTimeSlots([
      { date: formatDate(tomorrow), startTime: '18:00', endTime: '21:00', description: 'Evening rehearsal' },
      { date: formatDate(new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)), startTime: '18:00', endTime: '21:00', description: 'Evening rehearsal' }
    ]);
    // Select all actors by default
    setSelectedActorIds(actors.map(actor => actor.id || actor._id));
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { date: '', startTime: '', endTime: '', description: '' }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updatedSlots = timeSlots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setTimeSlots(updatedSlots);
  };

  const toggleScene = (sceneTitle: string) => {
    setSelectedScenes(prev => 
      prev.includes(sceneTitle) 
        ? prev.filter(s => s !== sceneTitle)
        : [...prev, sceneTitle]
    );
  };

  const toggleActor = (actorId: string) => {
    setSelectedActorIds(prev => 
      prev.includes(actorId) 
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    );
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // Enhanced validation with better messages
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your poll. For example: "Rehearsal for Act 1, Scene 2"');
      setSaving(false);
      return;
    }

    if (selectedActorIds.length === 0) {
      Alert.alert('No Actors Selected', 'Please select at least one actor who should respond to this poll. You can select multiple actors below.');
      setSaving(false);
      return;
    }

    const validTimeSlots = timeSlots.filter(slot => 
      slot.date && slot.startTime && slot.endTime
    );

    if (validTimeSlots.length === 0) {
      Alert.alert('No Time Slots', 'Please add at least one complete time slot with date, start time, and end time. Actors will choose their availability from these options.');
      setSaving(false);
      return;
    }

    // Auto-generate title if empty description
    const finalDescription = description.trim() || `Poll for ${selectedActorIds.length} actor${selectedActorIds.length > 1 ? 's' : ''} across ${validTimeSlots.length} time slot${validTimeSlots.length > 1 ? 's' : ''}`;

    const pollData = {
      title: title.trim(),
      description: finalDescription,
      timeSlots: validTimeSlots,
      scenes: selectedScenes,
      targetActorIds: selectedActorIds,
      settings
    };

    try {
      await onSave(pollData);
      resetForm();
      Alert.alert('Success! 🎉', `Your poll "${title.trim()}" has been created and sent to ${selectedActorIds.length} actor${selectedActorIds.length > 1 ? 's' : ''}!`);
    } catch (error: any) {
      console.error('Error saving poll:', error);
      setSaving(false);
      
      // Better error messages based on the error
      if (error?.message?.includes('403') || error?.message?.includes('admin')) {
        Alert.alert('Permission Required', 'Only administrators can create polls. Please contact your admin to create polls or to upgrade your account permissions.');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Oops! Something went wrong', `We couldn't create your poll right now. Please try again in a moment.\n\nError: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle={screenSize.isPhone ? "fullScreen" : "pageSheet"}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Poll</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Creating Poll...' : 'Create Poll'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Template Button */}
        <View style={styles.templateSection}>
          <TouchableOpacity onPress={useQuickTemplate} style={styles.templateButton}>
            <Text style={styles.templateButtonText}>⚡ Use Quick Template</Text>
          </TouchableOpacity>
          <Text style={styles.templateHelperText}>
            Fills in common rehearsal poll settings to get you started faster
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Poll Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Rehearsal for Act 1, Scene 2"
                maxLength={100}
              />
              <Text style={styles.helperText}>Give your poll a clear, descriptive title</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add any additional details about this poll..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Time Slot Options *</Text>
              <TouchableOpacity onPress={addTimeSlot} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Slot</Text>
              </TouchableOpacity>
            </View>

            {timeSlots.map((slot, index) => (
              <View key={index} style={styles.timeSlotCard}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.timeSlotTitle}>Time Slot {index + 1}</Text>
                  {timeSlots.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeTimeSlot(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.timeSlotInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={slot.date}
                      onChangeText={(value) => updateTimeSlot(index, 'date', value)}
                      placeholder="2024-12-25 (Year-Month-Day)"
                    />
                    <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
                  </View>

                  <View style={styles.timeRow}>
                    <View style={[styles.inputGroup, styles.timeInputHalf]}>
                      <Text style={styles.label}>Start Time *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={slot.startTime}
                        onChangeText={(value) => updateTimeSlot(index, 'startTime', value)}
                        placeholder="18:00 (24-hour)"
                      />
                      <Text style={styles.helperText}>24-hour format</Text>
                    </View>

                    <View style={[styles.inputGroup, styles.timeInputHalf]}>
                      <Text style={styles.label}>End Time *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={slot.endTime}
                        onChangeText={(value) => updateTimeSlot(index, 'endTime', value)}
                        placeholder="20:00 (24-hour)"
                      />
                      <Text style={styles.helperText}>24-hour format</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={slot.description || ''}
                      onChangeText={(value) => updateTimeSlot(index, 'description', value)}
                      placeholder="e.g., Main rehearsal room"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Scenes */}
          {scenes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related Scenes (Optional)</Text>
              <View style={styles.selectionGrid}>
                {scenes.map((scene) => (
                  <TouchableOpacity
                    key={scene.id || scene._id}
                    style={[
                      styles.selectionItem,
                      selectedScenes.includes(scene.title) && styles.selectedItem
                    ]}
                    onPress={() => toggleScene(scene.title)}
                  >
                    <Text style={[
                      styles.selectionText,
                      selectedScenes.includes(scene.title) && styles.selectedText
                    ]}>
                      {scene.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Target Actors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Actors * ({selectedActorIds.length} selected)</Text>
            <Text style={styles.subtitle}>Select actors who should respond to this poll. They'll receive a notification and can respond with their availability.</Text>
            <View style={styles.selectionGrid}>
              {actors.map((actor) => (
                <TouchableOpacity
                  key={actor.id || actor._id}
                  style={[
                    styles.selectionItem,
                    selectedActorIds.includes(actor.id || actor._id) && styles.selectedItem
                  ]}
                  onPress={() => toggleActor(actor.id || actor._id)}
                >
                  <Text style={[
                    styles.selectionText,
                    selectedActorIds.includes(actor.id || actor._id) && styles.selectedText
                  ]}>
                    {actor.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Poll Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allow multiple selections</Text>
              <Switch
                value={settings.allowMultipleSelections}
                onValueChange={(value) => setSettings(prev => ({ ...prev, allowMultipleSelections: value }))}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Require all actors to attend</Text>
              <Switch
                value={settings.requireAllActors}
                onValueChange={(value) => setSettings(prev => ({ ...prev, requireAllActors: value }))}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show responses publicly</Text>
              <Switch
                value={settings.showResponsesPublically}
                onValueChange={(value) => setSettings(prev => ({ ...prev, showResponsesPublically: value }))}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allow comments</Text>
              <Switch
                value={settings.allowComments}
                onValueChange={(value) => setSettings(prev => ({ ...prev, allowComments: value }))}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createResponsiveStyles = (screenSize: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: responsive.spacing.md,
      paddingTop: screenSize.isPhone ? 60 : 40,
      paddingBottom: responsive.spacing.md,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      minHeight: responsive.touchTarget.large,
    },
    title: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600' as const,
      color: '#1e293b',
    },
    cancelButton: {
      paddingVertical: responsive.spacing.sm,
      paddingHorizontal: responsive.spacing.md,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    cancelButtonText: {
      fontSize: responsive.fontSize.md,
      color: '#64748b',
    },
    saveButton: {
      paddingVertical: responsive.spacing.sm,
      paddingHorizontal: responsive.spacing.md,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    saveButtonText: {
      fontSize: responsive.fontSize.md,
      color: '#ffffff',
      fontWeight: '600' as const,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: responsive.spacing.md,
      paddingBottom: responsive.spacing.xl,
    },
    section: {
      marginTop: responsive.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: responsive.spacing.md,
      flexWrap: screenSize.isPhone ? 'wrap' as const : 'nowrap' as const,
    },
    sectionTitle: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600' as const,
      color: '#1e293b',
      marginBottom: responsive.spacing.md,
    },
    subtitle: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      marginBottom: responsive.spacing.sm,
    },
    inputGroup: {
      marginBottom: responsive.spacing.md,
    },
    label: {
      fontSize: responsive.fontSize.sm,
      fontWeight: '500' as const,
      color: '#374151',
      marginBottom: responsive.spacing.xs,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.sm,
      fontSize: responsive.fontSize.md,
      backgroundColor: '#ffffff',
      minHeight: responsive.touchTarget.small,
    },
    multilineInput: {
      minHeight: screenSize.isPhone ? 80 : 100,
      textAlignVertical: 'top' as const,
    },
    addButton: {
      backgroundColor: '#10b981',
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.xs,
      borderRadius: 6,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: responsive.fontSize.sm,
      fontWeight: '500' as const,
    },
    timeSlotCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: responsive.spacing.md,
      marginBottom: responsive.spacing.sm,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    timeSlotHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: responsive.spacing.sm,
      flexWrap: screenSize.isPhone ? 'wrap' as const : 'nowrap' as const,
    },
    timeSlotTitle: {
      fontSize: responsive.fontSize.md,
      fontWeight: '500' as const,
      color: '#1e293b',
    },
    removeButton: {
      backgroundColor: '#ef4444',
      paddingHorizontal: responsive.spacing.xs,
      paddingVertical: responsive.spacing.xs / 2,
      borderRadius: 4,
      marginTop: screenSize.isPhone ? responsive.spacing.xs : 0,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    removeButtonText: {
      color: '#ffffff',
      fontSize: responsive.fontSize.xs,
      fontWeight: '500' as const,
    },
    timeSlotInputs: {
      gap: responsive.spacing.sm,
    },
    timeRow: {
      flexDirection: screenSize.isPhone ? 'column' as const : 'row' as const,
      gap: responsive.spacing.sm,
    },
    timeInputHalf: {
      flex: screenSize.isPhone ? undefined : 1,
    },
    selectionGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: responsive.spacing.xs,
    },
    selectionItem: {
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.xs,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#d1d5db',
      backgroundColor: '#ffffff',
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      minWidth: screenSize.isPhone ? '45%' : undefined,
    },
    selectedItem: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
    },
    selectionText: {
      fontSize: responsive.fontSize.sm,
      color: '#374151',
      textAlign: 'center' as const,
    },
    selectedText: {
      color: '#ffffff',
      fontWeight: '500' as const,
    },
    settingRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: responsive.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      minHeight: responsive.touchTarget.medium,
    },
    settingLabel: {
      fontSize: responsive.fontSize.md,
      color: '#374151',
      flex: 1,
      paddingRight: responsive.spacing.sm,
    },
    helperText: {
      fontSize: responsive.fontSize.xs,
      color: '#64748b',
      marginTop: responsive.spacing.xs / 2,
      fontStyle: 'italic',
    },
    saveButtonDisabled: {
      backgroundColor: '#9ca3af',
      opacity: 0.7,
    },
    templateSection: {
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      backgroundColor: '#f8fafc',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    templateButton: {
      backgroundColor: '#10b981',
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      minHeight: responsive.touchTarget.small,
    },
    templateButtonText: {
      color: '#ffffff',
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
    },
    templateHelperText: {
      fontSize: responsive.fontSize.xs,
      color: '#64748b',
      textAlign: 'center',
      marginTop: responsive.spacing.xs,
      fontStyle: 'italic',
    },
  });
};

