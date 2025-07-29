import { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch } from 'react-native';
import { commonStyles } from '../styles/common';

interface Actor {
  id: string;
  name: string;
  scenes?: string[];
}

interface Scene {
  id: string;
  title: string;
  name?: string;
}

interface ActorRequirement {
  actor: Actor;
  isRequired: boolean;
}

interface EnhancedAddRehearsalModalProps {
  visible: boolean;
  onSave: (rehearsalData: any) => void;
  onCancel: () => void;
  actors: Actor[];
  scenes: Scene[];
}

const EnhancedAddRehearsalModal = ({ visible, onSave, onCancel, actors = [], scenes = [] }: EnhancedAddRehearsalModalProps) => {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<any>(null);
  const [actorRequirements, setActorRequirements] = useState<ActorRequirement[]>([]);
  const [rehearsalTitle, setRehearsalTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requireAllActors, setRequireAllActors] = useState(true);
  const [minRequiredActors, setMinRequiredActors] = useState('1');

  // Generate calendar dates for the next 30 days
  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      dates.push({
        id: dateId,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
        isToday: i === 0,
        date: date
      });
    }
    
    return dates;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        slots.push({
          id: `${startTime}-${endTime}`,
          start: startTime,
          end: endTime,
          display: `${startTime} - ${endTime}`
        });
      }
    }
    return slots;
  };

  const dateOptions = useMemo(() => generateCalendarDates(), []);
  const timeOptions = useMemo(() => generateTimeSlots(), []);

  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene);
    setRehearsalTitle(`${scene.title} Rehearsal`);
    
    // Auto-populate actors based on scene
    const sceneActors = actors.filter(actor => 
      actor.scenes && actor.scenes.includes(scene.title)
    );
    
    const requirements = sceneActors.map(actor => ({
      actor,
      isRequired: true // Default to required
    }));
    
    setActorRequirements(requirements);
  };

  const handleDateSelect = (date: any) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: any) => {
    setSelectedTime(time);
  };

  const toggleActorRequirement = (actorId: string) => {
    setActorRequirements(prev => {
      const existing = prev.find(req => req.actor.id === actorId);
      if (existing) {
        // Toggle requirement status
        return prev.map(req => 
          req.actor.id === actorId 
            ? { ...req, isRequired: !req.isRequired }
            : req
        );
      } else {
        // Add new actor requirement
        const actor = actors.find(a => a.id === actorId);
        if (actor) {
          return [...prev, { actor, isRequired: false }];
        }
      }
      return prev;
    });
  };

  const addActorToRehearsal = (actor: Actor) => {
    const alreadyAdded = actorRequirements.some(req => req.actor.id === actor.id);
    if (!alreadyAdded) {
      setActorRequirements(prev => [...prev, { actor, isRequired: false }]);
    }
  };

  const removeActorFromRehearsal = (actorId: string) => {
    setActorRequirements(prev => prev.filter(req => req.actor.id !== actorId));
  };

  const handleSave = () => {
    if (!selectedScene) {
      Alert.alert('Error', 'Please select a scene');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time');
      return;
    }

    if (actorRequirements.length === 0) {
      Alert.alert('Error', 'Please select at least one actor');
      return;
    }

    const requiredActors = actorRequirements.filter(req => req.isRequired);
    const minRequired = parseInt(minRequiredActors) || 1;

    if (requireAllActors && requiredActors.length === 0) {
      Alert.alert('Error', 'Please mark at least one actor as required');
      return;
    }

    const rehearsalData = {
      title: rehearsalTitle || `${selectedScene.title} Rehearsal`,
      description,
      scene: selectedScene.title,
      date: selectedDate.id,
      time: {
        start: selectedTime.start,
        end: selectedTime.end
      },
      actorIds: actorRequirements.map(req => req.actor.id),
      actors: actorRequirements.map(req => req.actor),
      // Enhanced rehearsal data for subset participation
      actorRequirements: actorRequirements.map(req => ({
        actorId: req.actor.id,
        actorName: req.actor.name,
        isRequired: req.isRequired
      })),
      subsetParticipation: {
        enabled: !requireAllActors,
        minRequiredActors: minRequired,
        requiredActorCount: requiredActors.length,
        optionalActorCount: actorRequirements.length - requiredActors.length
      }
    };

    onSave(rehearsalData);
    resetForm();
  };

  const resetForm = () => {
    setSelectedScene(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setActorRequirements([]);
    setRehearsalTitle('');
    setDescription('');
    setRequireAllActors(true);
    setMinRequiredActors('1');
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const availableActors = actors.filter(actor => 
    !actorRequirements.some(req => req.actor.id === actor.id)
  );

  const requiredCount = actorRequirements.filter(req => req.isRequired).length;
  const optionalCount = actorRequirements.length - requiredCount;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      {visible && (
        <View style={commonStyles.modalOverlay}>
          <View style={[commonStyles.modalContent, { maxHeight: '95%', width: '95%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={commonStyles.modalTitle}>Enhanced Rehearsal Creation</Text>
              
              {/* Basic Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rehearsal Title</Text>
                  <TextInput
                    style={styles.textInput}
                    value={rehearsalTitle}
                    onChangeText={setRehearsalTitle}
                    placeholder="Enter rehearsal title"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add rehearsal notes or special instructions"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Scene Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Scene</Text>
                {(!scenes || scenes.length === 0) ? (
                  <Text style={styles.noDataText}>
                    No scenes available. Please create scenes first.
                  </Text>
                ) : (
                  scenes.map(scene => (
                    <TouchableOpacity
                      key={scene.id}
                      style={[
                        styles.selectItem,
                        selectedScene?.id === scene.id && styles.selectItemSelected
                      ]}
                      onPress={() => handleSceneSelect(scene)}
                    >
                      <Text style={[
                        styles.selectText,
                        selectedScene?.id === scene.id && styles.selectTextSelected
                      ]}>
                        {selectedScene?.id === scene.id ? '●' : '○'} {scene.title || scene.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Date Selection */}
              {selectedScene && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.calendarContainer}>
                      {dateOptions.map(date => (
                        <TouchableOpacity
                          key={date.id}
                          style={[
                            styles.calendarDate,
                            selectedDate?.id === date.id && styles.calendarDateSelected,
                            date.isToday && styles.calendarDateToday
                          ]}
                          onPress={() => handleDateSelect(date)}
                        >
                          <Text style={[
                            styles.calendarDayName,
                            selectedDate?.id === date.id && styles.calendarTextSelected
                          ]}>
                            {date.dayName}
                          </Text>
                          <Text style={[
                            styles.calendarDayNumber,
                            selectedDate?.id === date.id && styles.calendarTextSelected,
                            date.isToday && styles.calendarTodayText
                          ]}>
                            {date.day}
                          </Text>
                          <Text style={[
                            styles.calendarMonth,
                            selectedDate?.id === date.id && styles.calendarTextSelected
                          ]}>
                            {date.monthName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Time Selection */}
              {selectedDate && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Select Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.timeContainer}>
                      {timeOptions.map(time => (
                        <TouchableOpacity
                          key={time.id}
                          style={[
                            styles.timeSlot,
                            selectedTime?.id === time.id && styles.timeSlotSelected
                          ]}
                          onPress={() => handleTimeSelect(time)}
                        >
                          <Text style={[
                            styles.timeText,
                            selectedTime?.id === time.id && styles.timeTextSelected
                          ]}>
                            {time.display}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Actor Requirements */}
              {selectedTime && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Actor Participation</Text>
                  
                  {/* Participation Settings */}
                  <View style={styles.participationSettings}>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Require all selected actors</Text>
                      <Switch
                        value={requireAllActors}
                        onValueChange={setRequireAllActors}
                      />
                    </View>
                    
                    {!requireAllActors && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Minimum required actors</Text>
                        <TextInput
                          style={[styles.textInput, { width: 100 }]}
                          value={minRequiredActors}
                          onChangeText={setMinRequiredActors}
                          keyboardType="numeric"
                          placeholder="1"
                        />
                      </View>
                    )}
                  </View>

                  {/* Current Actor Requirements */}
                  {actorRequirements.length > 0 && (
                    <View style={styles.actorRequirements}>
                      <Text style={styles.subsectionTitle}>
                        Selected Actors ({requiredCount} required, {optionalCount} optional)
                      </Text>
                      {actorRequirements.map(requirement => (
                        <View key={requirement.actor.id} style={styles.actorRequirement}>
                          <View style={styles.actorInfo}>
                            <Text style={styles.actorName}>{requirement.actor.name}</Text>
                            <Text style={[
                              styles.requirementStatus,
                              { color: requirement.isRequired ? '#dc2626' : '#059669' }
                            ]}>
                              {requirement.isRequired ? 'Required' : 'Optional'}
                            </Text>
                          </View>
                          <View style={styles.actorActions}>
                            <TouchableOpacity
                              style={styles.toggleButton}
                              onPress={() => toggleActorRequirement(requirement.actor.id)}
                            >
                              <Text style={styles.toggleButtonText}>
                                {requirement.isRequired ? 'Make Optional' : 'Make Required'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeActorFromRehearsal(requirement.actor.id)}
                            >
                              <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Available Actors */}
                  {availableActors.length > 0 && (
                    <View style={styles.availableActors}>
                      <Text style={styles.subsectionTitle}>Add More Actors</Text>
                      <View style={styles.actorGrid}>
                        {availableActors.map(actor => (
                          <TouchableOpacity
                            key={actor.id}
                            style={styles.availableActorButton}
                            onPress={() => addActorToRehearsal(actor)}
                          >
                            <Text style={styles.availableActorText}>+ {actor.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={commonStyles.modalButtons}>
              <TouchableOpacity style={commonStyles.cancelButton} onPress={handleCancel}>
                <Text style={commonStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={commonStyles.saveButton} onPress={handleSave}>
                <Text style={commonStyles.saveButtonText}>Create Rehearsal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  selectItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3b82f6',
  },
  selectText: {
    fontSize: 16,
    color: '#64748b',
  },
  selectTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  calendarContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarDate: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarDateSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  calendarDateToday: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  calendarDayName: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  calendarDayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginVertical: 2,
  },
  calendarMonth: {
    fontSize: 10,
    color: '#64748b',
  },
  calendarTextSelected: {
    color: '#ffffff',
  },
  calendarTodayText: {
    color: '#10b981',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeSlotSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  timeTextSelected: {
    color: '#ffffff',
  },
  participationSettings: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  actorRequirements: {
    marginBottom: 16,
  },
  actorRequirement: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actorInfo: {
    flex: 1,
  },
  actorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  requirementStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  actorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  availableActors: {
    marginTop: 16,
  },
  actorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableActorButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  availableActorText: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '500',
  },
});

export default EnhancedAddRehearsalModal;