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

interface DateRange {
  id: string;
  date: string;
  earliestTime: string;
  latestTime: string;
  suggestedDuration: number; // minutes
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
  const [dateRanges, setDateRanges] = useState<DateRange[]>([
    { id: 'range-1', date: '', earliestTime: '18:00', latestTime: '22:00', suggestedDuration: 120, description: '' }
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
    setDateRanges([{ id: 'range-1', date: '', earliestTime: '18:00', latestTime: '22:00', suggestedDuration: 120, description: '' }]);
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
    setDescription('Mark your availability for upcoming rehearsals using the time ranges below');
    setDateRanges([
      { 
        id: 'range-1', 
        date: formatDate(tomorrow), 
        earliestTime: '18:00', 
        latestTime: '22:00', 
        suggestedDuration: 120, 
        description: 'Evening rehearsal options' 
      },
      { 
        id: 'range-2', 
        date: formatDate(new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)), 
        earliestTime: '18:00', 
        latestTime: '22:00', 
        suggestedDuration: 120, 
        description: 'Evening rehearsal options' 
      }
    ]);
    // Select all actors by default
    setSelectedActorIds(actors.map(actor => actor.id || actor._id));
  };

  const addDateRange = () => {
    const newId = `range-${Date.now()}`;
    setDateRanges([...dateRanges, { 
      id: newId, 
      date: '', 
      earliestTime: '18:00', 
      latestTime: '22:00', 
      suggestedDuration: 120, 
      description: '' 
    }]);
  };

  const removeDateRange = (index: number) => {
    if (dateRanges.length > 1) {
      setDateRanges(dateRanges.filter((_, i) => i !== index));
    }
  };

  const updateDateRange = (index: number, field: keyof DateRange, value: string | number) => {
    const updatedRanges = dateRanges.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    );
    setDateRanges(updatedRanges);
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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      errors.title = 'Please enter a title for your poll';
    }
    
    if (selectedActorIds.length === 0) {
      errors.actors = 'Please select at least one actor';
    }
    
    const validDateRanges = dateRanges.filter(range => 
      range.date && range.earliestTime && range.latestTime
    );
    
    if (validDateRanges.length === 0) {
      errors.dateRanges = 'Please add at least one complete date range';
    }
    
    // Validate time ranges
    for (let i = 0; i < validDateRanges.length; i++) {
      const range = validDateRanges[i];
      const toMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      if (toMinutes(range.earliestTime) >= toMinutes(range.latestTime)) {
        errors[`dateRange_${i}`] = 'Earliest time must be before latest time';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setValidationErrors({});
    
    const validDateRanges = dateRanges.filter(range => 
      range.date && range.earliestTime && range.latestTime
    );

    // Auto-generate title if empty description
    const finalDescription = description.trim() || `Mark your availability for ${selectedActorIds.length} actor${selectedActorIds.length > 1 ? 's' : ''} across ${validDateRanges.length} date range${validDateRanges.length > 1 ? 's' : ''}`;

    // Create backward-compatible timeSlots from dateRanges for legacy support
    const compatibleTimeSlots = validDateRanges.map((range, index) => ({
      id: range.id,
      date: range.date,
      startTime: range.earliestTime,
      endTime: range.latestTime,
      description: range.description || ''
    }));

    const pollData = {
      title: title.trim(),
      description: finalDescription,
      dateRanges: validDateRanges,      // New format
      timeSlots: compatibleTimeSlots,   // Legacy format for compatibility
      scenes: selectedScenes,
      targetActorIds: selectedActorIds,
      settings
    };

    console.log('🗳️ [Frontend] Creating poll with data:', {
      ...pollData,
      dateRangesCount: validDateRanges.length,
      targetActorIdsCount: selectedActorIds.length,
      sampleDateRange: validDateRanges[0]
    });

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
          <TouchableOpacity onPress={useQuickTemplate} style={styles.templateButton} activeOpacity={0.8}>
            <View style={styles.templateButtonContent}>
              <Text style={styles.templateButtonIcon}>⚡</Text>
              <Text style={styles.templateButtonText}>Use Quick Template</Text>
            </View>
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
                style={[styles.textInput, validationErrors.title && styles.textInputError]}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (validationErrors.title) {
                    setValidationErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                placeholder="e.g., Rehearsal for Act 1, Scene 2"
                maxLength={100}
              />
              {validationErrors.title ? (
                <Text style={styles.errorText}>{validationErrors.title}</Text>
              ) : (
                <Text style={styles.helperText}>Give your poll a clear, descriptive title</Text>
              )}
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

          {/* Date Ranges (Timeful-style) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Date & Time Ranges *</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{dateRanges.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={addDateRange} style={styles.addButton} activeOpacity={0.8}>
                <Text style={styles.addButtonIcon}>+</Text>
                <Text style={styles.addButtonText}>Add Range</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              🎯 Create time ranges where actors can mark their availability. Actors will use a visual grid to select when they're available within each range.
            </Text>

            {dateRanges.map((range, index) => (
              <View key={range.id} style={styles.timeSlotCard}>
                <View style={styles.timeSlotHeader}>
                  <View style={styles.timeSlotTitleContainer}>
                    <View style={styles.timeSlotNumber}>
                      <Text style={styles.timeSlotNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.timeSlotTitle}>Date Range {index + 1}</Text>
                  </View>
                  {dateRanges.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeDateRange(index)}
                      style={styles.removeButton}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeButtonIcon}>×</Text>
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.timeSlotInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date *</Text>
                    <TextInput
                      style={[styles.textInput, styles.dateInput]}
                      value={range.date}
                      onChangeText={(value) => updateDateRange(index, 'date', value)}
                      placeholder="2024-12-25"
                      keyboardType="numeric"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
                  </View>

                  <View style={styles.timeRow}>
                    <View style={[styles.inputGroup, styles.timeInputHalf]}>
                      <Text style={styles.label}>Earliest Time *</Text>
                      <TextInput
                        style={[styles.textInput, styles.timeInput]}
                        value={range.earliestTime}
                        onChangeText={(value) => updateDateRange(index, 'earliestTime', value)}
                        placeholder="18:00"
                        keyboardType="numeric"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={styles.helperText}>When range starts (24h format)</Text>
                    </View>

                    <View style={[styles.inputGroup, styles.timeInputHalf]}>
                      <Text style={styles.label}>Latest Time *</Text>
                      <TextInput
                        style={[styles.textInput, styles.timeInput]}
                        value={range.latestTime}
                        onChangeText={(value) => updateDateRange(index, 'latestTime', value)}
                        placeholder="22:00"
                        keyboardType="numeric"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={styles.helperText}>When range ends (24h format)</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Suggested Duration (minutes)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={range.suggestedDuration.toString()}
                      onChangeText={(value) => updateDateRange(index, 'suggestedDuration', parseInt(value) || 120)}
                      placeholder="120"
                      keyboardType="numeric"
                    />
                    <Text style={styles.helperText}>How long should the meeting be? (for reference)</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={range.description || ''}
                      onChangeText={(value) => updateDateRange(index, 'description', value)}
                      placeholder="e.g., Evening rehearsal options"
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
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Target Actors *</Text>
              <View style={styles.selectionCounter}>
                <Text style={styles.selectionCounterText}>{selectedActorIds.length} selected</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>👥 Select actors who should respond to this poll. They'll receive a notification and can respond with their availability.</Text>
            {validationErrors.actors && (
              <Text style={styles.errorText}>{validationErrors.actors}</Text>
            )}
            <View style={[styles.selectionGrid, validationErrors.actors && styles.selectionGridError]}>
              {actors.map((actor) => (
                <TouchableOpacity
                  key={actor.id || actor._id}
                  style={[
                    styles.selectionItem,
                    selectedActorIds.includes(actor.id || actor._id) && styles.selectedItem
                  ]}
                  onPress={() => {
                    toggleActor(actor.id || actor._id);
                    if (validationErrors.actors && selectedActorIds.length >= 0) {
                      setValidationErrors(prev => ({ ...prev, actors: '' }));
                    }
                  }}
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
            <Text style={styles.sectionTitle}>⚙️ Poll Settings</Text>
            <Text style={styles.subtitle}>Configure how your poll behaves and what information is visible to participants.</Text>
            
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
    sectionSubtitle: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      marginBottom: responsive.spacing.md,
      lineHeight: 20,
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
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      borderRadius: 8,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      gap: responsive.spacing.xs / 2,
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    addButtonIcon: {
      color: '#ffffff',
      fontSize: responsive.fontSize.md,
      fontWeight: '600' as const,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: responsive.fontSize.sm,
      fontWeight: '600' as const,
    },
    timeSlotCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: responsive.spacing.md,
      marginBottom: responsive.spacing.md,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.xs,
      borderRadius: 6,
      marginTop: screenSize.isPhone ? responsive.spacing.xs : 0,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      gap: responsive.spacing.xs / 2,
    },
    removeButtonIcon: {
      color: '#ffffff',
      fontSize: responsive.fontSize.md,
      fontWeight: '600' as const,
      lineHeight: responsive.fontSize.md,
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
      borderRadius: 12,
      alignItems: 'center',
      minHeight: responsive.touchTarget.medium,
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    templateButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacing.xs,
    },
    templateButtonIcon: {
      fontSize: responsive.fontSize.lg,
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
    sectionTitleContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: responsive.spacing.sm,
    },
    sectionBadge: {
      backgroundColor: '#3b82f6',
      borderRadius: 12,
      paddingHorizontal: responsive.spacing.xs,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: 'center' as const,
    },
    sectionBadgeText: {
      color: '#ffffff',
      fontSize: responsive.fontSize.xs,
      fontWeight: '600' as const,
    },
    timeSlotTitleContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: responsive.spacing.sm,
    },
    timeSlotNumber: {
      backgroundColor: '#f1f5f9',
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    timeSlotNumberText: {
      color: '#64748b',
      fontSize: responsive.fontSize.sm,
      fontWeight: '600' as const,
    },
    selectionCounter: {
      backgroundColor: '#10b981',
      borderRadius: 12,
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: 4,
    },
    selectionCounterText: {
      color: '#ffffff',
      fontSize: responsive.fontSize.xs,
      fontWeight: '600' as const,
    },
    textInputError: {
      borderColor: '#ef4444',
      borderWidth: 2,
    },
    errorText: {
      fontSize: responsive.fontSize.xs,
      color: '#ef4444',
      marginTop: responsive.spacing.xs / 2,
      fontWeight: '500' as const,
    },
    selectionGridError: {
      borderWidth: 1,
      borderColor: '#ef4444',
      borderRadius: 8,
      padding: responsive.spacing.xs,
    },
    timeInput: {
      textAlign: 'center',
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      fontVariant: screenSize.isPhone ? ['tabular-nums'] : undefined,
    },
    dateInput: {
      textAlign: 'center',
      fontSize: responsive.fontSize.md,
      fontWeight: '500',
      fontVariant: screenSize.isPhone ? ['tabular-nums'] : undefined,
    },
  });
};

