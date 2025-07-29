import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AvailabilityPeriod {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilityCalendarProps {
  onTimeSlotSelect: (day: number, hour: number, minute: number) => void;
  selectedSlots?: string[];
  readOnly?: boolean;
  availabilityPeriods?: AvailabilityPeriod[];
}

const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
const rehearsalDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  onTimeSlotSelect, 
  selectedSlots = [], 
  readOnly = false,
  availabilityPeriods = []
}) => {
  const generateTimeSlots = () => {
    const slots: { day: number; hour: number; minute: number }[] = [];
    
    // Rehearsal days: Sunday (0), Monday (1), Tuesday (2), Wednesday (3), Thursday (4)
    const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
    
    // Generate slots for rehearsal days and times (6:00 PM to 11:30 PM)
    for (const day of rehearsalDays) {
      for (let hour = 18; hour <= 23; hour++) { // 6 PM (18) to 11 PM (23)
        for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
          // For hour 23 (11 PM), include both 11:00 PM and 11:30 PM
          if (hour === 23 && minute > 30) {
            break; // Stop after 11:30 PM
          }
          slots.push({ day, hour, minute });
        }
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSlotSelected = (day: number, hour: number, minute: number) => {
    if (!selectedSlots || selectedSlots.length === 0) return false;
    
    return selectedSlots.some(slot => {
      try {
        const date = new Date(slot);
        return date.getDay() === day && 
               date.getHours() === hour && 
               date.getMinutes() === minute;
      } catch {
        return false;
      }
    });
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Group slots by time for display
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const timeKey = `${slot.hour}:${slot.minute}`;
    if (!acc[timeKey]) {
      acc[timeKey] = { hour: slot.hour, minute: slot.minute, days: [] };
    }
    acc[timeKey].days.push(slot.day);
    return acc;
  }, {} as Record<string, { hour: number; minute: number; days: number[] }>);

  const sortedTimes = Object.values(groupedSlots).sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.minute - b.minute;
  });

  if (timeSlots.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No rehearsal time slots available</Text>
          <Text style={styles.emptyStateSubtext}>Rehearsal times are Sunday, Monday, Tuesday, Wednesday, Thursday from 6:00 PM to 11:30 PM.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dayHeaderContainer}>
        <View style={styles.dayHeaderRow}>
          <View style={styles.timeColumnHeader} />
          {rehearsalDayNames.map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
        <View>
          {sortedTimes.map((timeGroup, timeIndex) => (
              <View key={timeIndex} style={styles.timeSlotRow}>
                <View style={styles.timeLabel}>
                  <Text style={styles.timeLabelText}>{formatTime(timeGroup.hour, timeGroup.minute)}</Text>
                </View>
                {rehearsalDays.map((dayIndex) => {
                  const isSelected = isSlotSelected(dayIndex, timeGroup.hour, timeGroup.minute);
                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.timeSlot,
                        isSelected && styles.selectedSlot,
                        readOnly && styles.readOnlySlot
                      ]}
                      onPress={() => !readOnly && onTimeSlotSelect(dayIndex, timeGroup.hour, timeGroup.minute)}
                      disabled={readOnly}
                    >
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Changed from fixed height to flex
    minHeight: 400, // Minimum height to ensure usability
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dayHeaderContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  timeColumnHeader: {
    width: 70,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  dayHeader: {
    flex: 1,
    minWidth: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  slotsContainer: {
    flex: 1,
  },
  timeSlotRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeLabel: {
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  timeLabelText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  timeSlot: {
    flex: 1,
    minWidth: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  selectedSlot: {
    backgroundColor: '#6366f1',
  },
  readOnlySlot: {
    opacity: 0.7,
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unavailableSlot: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default AvailabilityCalendar;
