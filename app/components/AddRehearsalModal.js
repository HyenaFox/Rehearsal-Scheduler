import { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const AddRehearsalModal = ({ visible, onSave, onCancel, actors = [], scenes = [] }) => {
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedActors, setSelectedActors] = useState([]);

  // Generate calendar dates for the next 30 days in a grid format
  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    // Ensure today is a valid date
    if (isNaN(today.getTime())) {
      console.error('Invalid base date');
      return [];
    }
    
    for (let i = 0; i < 30; i++) {
      try {
        // Use a more reliable date creation method
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate() + i;
        const date = new Date(year, month, day);
        
        // Ensure the date is valid
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date generated for day ${i}`);
          continue;
        }
        
        // Create date data with fallbacks
        const dayNumber = date.getDate();
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] || 'Day';
        const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()] || 'Month';
        const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const dateData = {
          id: dateId,
          day: dayNumber,
          month: date.getMonth(),
          year: date.getFullYear(),
          dayName: dayName,
          monthName: monthName,
          isToday: i === 0,
          date: date
        };
        
        // Validate all required properties exist and are valid
        if (dateData.id && 
            typeof dateData.day === 'number' && 
            dateData.day > 0 && 
            dateData.dayName && 
            dateData.monthName) {
          dates.push(dateData);
        } else {
          console.warn('Invalid date data generated:', dateData);
        }
      } catch (error) {
        console.error(`Error generating date for day ${i}:`, error);
      }
    }
    
    return dates;
  };

  // Generate time options in a grid format (9 AM to 9 PM)
  const generateTimeGrid = () => {
    const times = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        try {
          const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const time12 = new Date(`2000-01-01T${time24}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          times.push({
            id: time24,
            label: time12,
            value: time24
          });
        } catch (error) {
          console.error(`Error generating time for ${hour}:${minute}:`, error);
        }
      }
    }
    return times;
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime, durationMinutes) => {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      
      return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      // Fallback: add 1 hour
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHour = hours + 1;
      return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  const dateOptions = useMemo(() => {
    try {
      return generateCalendarDates();
    } catch (error) {
      console.error('Error generating calendar dates:', error);
      return [];
    }
  }, []);
  
  const timeOptions = useMemo(() => {
    try {
      return generateTimeGrid();
    } catch (error) {
      console.error('Error generating time grid:', error);
      return [];
    }
  }, []);

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    // Reset other selections when scene changes
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedActors([]);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Reset selected actors when date changes
    setSelectedActors([]);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    // Reset selected actors when time changes  
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
    if (!selectedScene) {
      Alert.alert('Error', 'Please select a scene to rehearse.');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date.');
      return;
    }
    
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time.');
      return;
    }
    
    if (selectedActors.length === 0) {
      Alert.alert('Error', 'Please select at least one actor.');
      return;
    }

    const newRehearsal = {
      id: Date.now().toString(),
      title: selectedScene.title || selectedScene.name, // Use scene title as rehearsal title
      scene: selectedScene.title || selectedScene.name, // Store scene name instead of full object
      date: selectedDate.id, // selectedDate.id is already in YYYY-MM-DD format
      time: {
        start: selectedTime.value,
        end: calculateEndTime(selectedTime.value, Math.min(selectedScene.duration || 30, 30)) // Max 30 minutes
      },
      actors: selectedActors,
    };

    onSave(newRehearsal);
    
    // Reset form
    setSelectedScene(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedActors([]);
  };

  const handleCancel = () => {
    // Reset form
    setSelectedScene(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedActors([]);
    onCancel();
  };

  // All actors are available when both date and time are selected
  const availableActors = (selectedDate && selectedTime) ? (actors || []) : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      {visible && (
        <View style={commonStyles.modalOverlay}>
          <View style={[commonStyles.modalContent, { maxHeight: '90%', width: '95%' }]}>
            <ScrollView>
            <Text style={commonStyles.modalTitle}>Add Rehearsal</Text>
            
            <Text style={styles.sectionTitle}>Select Scene:</Text>
            {(!scenes || scenes.length === 0) ? (
              <Text style={styles.noScenesText}>
                No scenes available. Please create scenes first.
              </Text>
            ) : (
              scenes.map(scene => (
                <TouchableOpacity
                  key={scene.id || scene._id}
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

            {selectedScene && (
              <>
                <Text style={styles.sectionTitle}>Select Date:</Text>
                <View style={styles.calendarContainer}>
                  {dateOptions && Array.isArray(dateOptions) && dateOptions.length > 0 ? dateOptions.filter(date => date && typeof date === 'object' && date.day !== undefined).map(date => {
                    // Safety check to ensure date object exists and has required properties
                    if (!date || typeof date.day === 'undefined' || !date.id || !date.dayName || !date.monthName) {
                      console.warn('Invalid date object:', date);
                      return null;
                    }
                    
                    return (
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
                    );
                  }).filter(Boolean) : (
                    <Text style={styles.noScenesText}>No dates available</Text>
                  )}
                </View>
              </>
            )}

            {selectedDate && (
              <>
                <Text style={styles.sectionTitle}>Select Time:</Text>
                <View style={styles.timeGrid}>
                  {timeOptions && Array.isArray(timeOptions) && timeOptions.length > 0 ? timeOptions.filter(time => time && typeof time === 'object' && time.id && time.label).map(time => {
                    // Safety check for time object
                    if (!time || !time.id || !time.label) {
                      console.warn('Invalid time object:', time);
                      return null;
                    }
                    
                    return (
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
                          {time.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }).filter(Boolean) : (
                    <Text style={styles.noScenesText}>No times available</Text>
                  )}
                </View>
              </>
            )}

            {selectedDate && selectedTime && (
              <>
                <Text style={styles.sectionTitle}>
                  Select Actors (Available: {availableActors.length}):
                </Text>
                {availableActors.length === 0 ? (
                  <Text style={styles.noActorsText}>
                    No actors are available for this time
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
      )}
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
    marginBottom: 12,
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
    fontWeight: 'bold',
  },
  // Calendar styles
  calendarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarDate: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minWidth: '18%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarDateSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  calendarDateToday: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  calendarDayName: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  calendarDayNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginVertical: 2,
  },
  calendarMonth: {
    fontSize: 9,
    color: '#888',
  },
  calendarTextSelected: {
    color: '#ffffff',
  },
  calendarTodayText: {
    color: '#28a745',
  },
  // Time grid styles
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeSlot: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeSlotSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  timeTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
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
  noScenesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginBottom: 16,
  },
};

export default AddRehearsalModal;
