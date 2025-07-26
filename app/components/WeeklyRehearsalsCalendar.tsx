import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Rehearsal {
  id: string;
  title: string;
  scene?: string;
  // New format
  date?: string;
  time?: {
    start: string;
    end: string;
  };
  // Old format
  timeslot?: {
    day: string;
    startTime: string;
    endTime: string;
  };
  actors: any[];
}

interface WeeklyRehearsalsCalendarProps {
  rehearsals: Rehearsal[];
  onTimeSlotSelect?: (day: number, hour: number, minute: number, rehearsal: Rehearsal | null) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  rehearsal: Rehearsal | null;
  day: string;
  time: string;
}

const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
const rehearsalDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const WeeklyRehearsalsCalendar: React.FC<WeeklyRehearsalsCalendarProps> = ({ 
  rehearsals,
  onTimeSlotSelect
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    rehearsal: null,
    day: '',
    time: ''
  });


  const formatTime = (hour: number, minute: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${amPm}`;
  };

  const handlePress = (dayIndex: number, hour: number, minute: number, rehearsal: Rehearsal | null) => {
    onTimeSlotSelect?.(dayIndex, hour, minute, rehearsal);
  };

  const generateTimeSlots = () => {
    const slots: { day: number; hour: number; minute: number }[] = [];
    
    // Generate slots for rehearsal days and times (6:00 PM to 11:30 PM)
    for (const day of rehearsalDays) {
      for (let hour = 18; hour <= 23; hour++) { // 6 PM (18) to 11 PM (23)
        for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
          // Include 11:30 PM (23:30) as the last slot
          if (hour === 23 && minute === 30) {
            slots.push({ day, hour, minute });
            break; // Stop after 11:30 PM
          } else if (hour < 23) {
            slots.push({ day, hour, minute });
          }
        }
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get the week that contains the most rehearsals, or current week if no rehearsals
  const getWeekToDisplay = () => {
    if (rehearsals.length === 0) {
      // No rehearsals, show current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return startOfWeek;
    }

    // Get all rehearsal dates
    const rehearsalDates = rehearsals
      .filter(r => r.date)
      .map(r => new Date(r.date + 'T00:00:00'));

    if (rehearsalDates.length > 0) {
      // Find the week that contains the most rehearsals
      const weekCounts = new Map<string, number>();
      
      rehearsalDates.forEach(date => {
        // Calculate the start of the week (Sunday) for this date
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const weekKey = startOfWeek.toISOString().split('T')[0];
        
        weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1);
      });
      
      // Find the week with the most rehearsals
      let bestWeek = '';
      let maxCount = 0;
      
      weekCounts.forEach((count, week) => {
        if (count > maxCount) {
          maxCount = count;
          bestWeek = week;
        }
      });
      
      if (bestWeek) {
        return new Date(bestWeek + 'T00:00:00');
      }
    }

    // Fallback to current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return startOfWeek;
  };

  const weekToDisplay = getWeekToDisplay();

  const getRehearsalForSlot = (day: number, hour: number, minute: number): Rehearsal | null => {
    return rehearsals.find(rehearsal => {
      // Handle new format with date and time
      if (rehearsal.date && rehearsal.time && rehearsal.time.start) {
        // Use the determined week to display
        const targetDate = new Date(weekToDisplay);
        targetDate.setDate(weekToDisplay.getDate() + day); // Add the day offset
        
        const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (rehearsal.date !== targetDateStr) return false;
        
        // Parse rehearsal start time (handle both "HH:MM" and "HH:MM:SS" formats)
        const timeParts = rehearsal.time.start.split(':');
        const rehearsalHour = parseInt(timeParts[0], 10);
        const rehearsalMinute = parseInt(timeParts[1], 10);
        
        // Check if the rehearsal starts within this time slot
        return rehearsalHour === hour && rehearsalMinute === minute;
      }
      
      // Handle old format with timeslot
      if (rehearsal.timeslot && rehearsal.timeslot.day && rehearsal.timeslot.startTime) {
        // Convert day name to day index
        const dayNameToIndex: { [key: string]: number } = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        
        const rehearsalDayIndex = dayNameToIndex[rehearsal.timeslot.day];
        if (rehearsalDayIndex !== day) return false;
        
        // Parse rehearsal start time (24-hour format)
        const [rehearsalHour, rehearsalMinute] = rehearsal.timeslot.startTime.split(':').map(Number);
        
        // Check if the rehearsal starts within this time slot
        return rehearsalHour === hour && rehearsalMinute === minute;
      }
      
      return false;
    }) || null;
  };

  const getSlotColor = (rehearsal: Rehearsal | null) => {
    if (!rehearsal) return '#ffffff'; // White for empty slots
    
    // Different colors based on scene or could be based on other criteria
    const colors = [
      '#e0f2fe', // Light blue
      '#f0fdf4', // Light green
      '#fef3c7', // Light yellow
      '#fce7f3', // Light pink
      '#e0e7ff', // Light purple
    ];
    
    // Get scene name from either format
    const sceneName = rehearsal.scene || rehearsal.title || 'Unknown';
    
    // Use a simple hash to consistently assign colors to scenes
    const sceneHash = sceneName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(sceneHash) % colors.length];
  };

  const renderTimeSlotGrid = () => {
    const grid: JSX.Element[] = [];
    
    // Header row with day names
    grid.push(
      <View key="header" style={styles.headerRow}>
        <View style={styles.timeHeaderCell}>
          <Text style={styles.timeHeaderText}>Time</Text>
        </View>
        {rehearsalDayNames.map((dayName, index) => (
          <View key={dayName} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{dayName}</Text>
          </View>
        ))}
      </View>
    );

    // Group time slots by hour:minute
    const timeGroups: { [key: string]: { day: number; hour: number; minute: number }[] } = {};
    timeSlots.forEach(slot => {
      const timeKey = `${slot.hour}:${slot.minute.toString().padStart(2, '0')}`;
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(slot);
    });

    // Create rows for each time
    Object.keys(timeGroups).sort().forEach((timeKey, rowIndex) => {
      const [hour, minute] = timeKey.split(':').map(Number);
      const timeString = formatTime(hour, minute);
      
      grid.push(
        <View key={timeKey} style={styles.timeRow}>
          <View style={styles.timeCell}>
            <Text style={styles.timeText}>{timeString}</Text>
          </View>
          {rehearsalDays.map(day => {
            const rehearsal = getRehearsalForSlot(day, hour, minute);
            const backgroundColor = getSlotColor(rehearsal);
            
            return (
              <Pressable
                key={`${day}-${hour}-${minute}`}
                style={[
                  styles.slotCell,
                  { backgroundColor }
                ]}
                onPress={() => handlePress(day, hour, minute, rehearsal)}
              >
                {rehearsal ? (
                  <View style={styles.rehearsalInfo}>
                    <Text style={styles.rehearsalTitle} numberOfLines={1}>
                      {rehearsal.title}
                    </Text>
                    <Text style={styles.rehearsalActors} numberOfLines={1}>
                      {rehearsal.actors?.length || 0} actors
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      );
    });

    return grid;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.verticalScroll}
        >
          <View style={styles.grid}>
            {renderTimeSlotGrid()}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    minWidth: '100%',
  },
  verticalScroll: {
    flex: 1,
  },
  grid: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  timeHeaderCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  timeHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  dayHeaderCell: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 60,
  },
  timeCell: {
    width: 80,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  slotCell: {
    flex: 1,
    minWidth: 120,
    minHeight: 60,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rehearsalInfo: {
    width: '100%',
    alignItems: 'center',
  },
  rehearsalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  rehearsalActors: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default WeeklyRehearsalsCalendar;