import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { format, getDay, parse, startOfWeek, addDays } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import ApiService from '../services/api';
import { responsive, getScreenSize } from '../utils/responsive';

interface WeeklyPlannerProps {
  onSelectionChange: (selectedSlots: Date[]) => void;
  initialSelections?: string[];
}

const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
const rehearsalDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onSelectionChange, initialSelections = [] }) => {
  const [selectedSlots, setSelectedSlots] = useState<Date[]>([]);
  const [weeklyAvailabilities, setWeeklyAvailabilities] = useState<any[]>([]);
  const { actors } = useApp();
  const screenSize = getScreenSize();
  const styles = createResponsiveStyles(screenSize);

  // Initialize selected slots from props
  useEffect(() => {
    const initialSlots = initialSelections.map(s => new Date(s));
    setSelectedSlots(initialSlots);
  }, [initialSelections]);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const availabilities = await ApiService.getWeeklyAvailabilities();
        setWeeklyAvailabilities(availabilities);
      } catch (error) {
        console.error('Error fetching weekly availabilities:', error);
      }
    };
    fetchAvailabilities();
  }, []);

  // Generate time slots for rehearsal times (6:00 PM to 11:30 PM)
  const generateTimeSlots = () => {
    const slots: { day: number; hour: number; minute: number; date: Date }[] = [];
    const today = startOfWeek(new Date()); // Get start of current week

    for (const dayIndex of rehearsalDays) {
      const dayDate = addDays(today, dayIndex);
      
      for (let hour = 18; hour <= 23; hour++) { // 6 PM to 11 PM
        for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
          if (hour === 23 && minute > 30) break; // Stop after 11:30 PM
          
          const slotDate = new Date(dayDate);
          slotDate.setHours(hour, minute, 0, 0);
          
          slots.push({ day: dayIndex, hour, minute, date: slotDate });
        }
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSlotSelected = (date: Date) => {
    return selectedSlots.some(slot => 
      slot.getTime() === date.getTime()
    );
  };

  const isSlotAvailable = (day: number, hour: number, minute: number) => {
    if (weeklyAvailabilities.length === 0) return true;
    
    const timeInMinutes = hour * 60 + minute;
    
    return weeklyAvailabilities.some(avail => {
      if (avail.dayOfWeek !== day) return false;
      
      const [startHour, startMinute] = avail.startTime.split(':').map(Number);
      const [endHour, endMinute] = avail.endTime.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return timeInMinutes >= startTimeInMinutes && timeInMinutes < endTimeInMinutes;
    });
  };

  const handleTimeSlotPress = useCallback((date: Date, day: number, hour: number, minute: number) => {
    if (!isSlotAvailable(day, hour, minute)) return;

    let updatedSlots;
    if (isSlotSelected(date)) {
      // Remove slot
      updatedSlots = selectedSlots.filter(slot => slot.getTime() !== date.getTime());
    } else {
      // Add slot
      updatedSlots = [...selectedSlots, date];
    }
    
    setSelectedSlots(updatedSlots);
    onSelectionChange(updatedSlots);
  }, [selectedSlots, onSelectionChange]);

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Group slots by time for display
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const timeKey = `${slot.hour}:${slot.minute}`;
    if (!acc[timeKey]) {
      acc[timeKey] = { hour: slot.hour, minute: slot.minute, slots: [] };
    }
    acc[timeKey].slots.push(slot);
    return acc;
  }, {} as Record<string, { hour: number; minute: number; slots: typeof timeSlots }>);

  const sortedTimes = Object.values(groupedSlots).sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.minute - b.minute;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Availability</Text>
      <Text style={styles.subtitle}>Tap time slots to toggle availability</Text>
      
      {/* Header with day names */}
      <View style={styles.headerRow}>
        <View style={styles.timeHeaderCell} />
        {rehearsalDayNames.map((dayName, index) => (
          <View key={index} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable time slots */}
      <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
        {sortedTimes.map((timeGroup) => (
          <View key={`${timeGroup.hour}-${timeGroup.minute}`} style={styles.timeSlotRow}>
            <View style={styles.timeCell}>
              <Text style={styles.timeCellText}>
                {formatTime(timeGroup.hour, timeGroup.minute)}
              </Text>
            </View>
            
            {rehearsalDays.map(dayIndex => {
              const slot = timeGroup.slots.find(s => s.day === dayIndex);
              if (!slot) return <View key={dayIndex} style={styles.emptyCell} />;
              
              const isSelected = isSlotSelected(slot.date);
              const isAvailable = isSlotAvailable(slot.day, slot.hour, slot.minute);
              
              return (
                <TouchableOpacity
                  key={`${dayIndex}-${timeGroup.hour}-${timeGroup.minute}`}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.selectedSlot,
                    !isAvailable && styles.unavailableSlot
                  ]}
                  onPress={() => handleTimeSlotPress(slot.date, slot.day, slot.hour, slot.minute)}
                  disabled={!isAvailable}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f8f9fa' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        {weeklyAvailabilities.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f5f5f5' }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createResponsiveStyles = (screenSize: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      margin: responsive.spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
      textAlign: 'center',
      paddingTop: responsive.spacing.md,
      paddingBottom: responsive.spacing.xs,
    },
    subtitle: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      textAlign: 'center',
      paddingBottom: responsive.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      backgroundColor: '#f8fafc',
    },
    timeHeaderCell: {
      width: screenSize.isPhone ? 60 : 70,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    dayHeaderCell: {
      flex: 1,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    dayHeaderText: {
      fontSize: responsive.fontSize.sm,
      fontWeight: '600',
      color: '#374151',
    },
    slotsContainer: {
      flex: 1,
      maxHeight: screenSize.isPhone ? 300 : 400,
    },
    timeSlotRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    timeCell: {
      width: screenSize.isPhone ? 60 : 70,
      height: screenSize.isPhone ? 35 : 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
      backgroundColor: '#f8fafc',
    },
    timeCellText: {
      fontSize: screenSize.isPhone ? 9 : 11,
      color: '#64748b',
      fontWeight: '500',
      textAlign: 'center',
    },
    timeSlot: {
      flex: 1,
      height: screenSize.isPhone ? 35 : 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#f1f5f9',
      backgroundColor: '#ffffff',
      minHeight: responsive.touchTarget.small,
    },
    selectedSlot: {
      backgroundColor: '#6366f1',
    },
    unavailableSlot: {
      backgroundColor: '#f5f5f5',
      opacity: 0.5,
    },
    emptyCell: {
      flex: 1,
      height: screenSize.isPhone ? 35 : 40,
      borderRightWidth: 1,
      borderRightColor: '#f1f5f9',
      backgroundColor: '#f5f5f5',
    },
    checkmark: {
      color: '#ffffff',
      fontSize: responsive.fontSize.sm,
      fontWeight: 'bold',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      backgroundColor: '#f8fafc',
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      flexWrap: 'wrap',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: screenSize.isPhone ? responsive.spacing.xs : 0,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 2,
      marginRight: responsive.spacing.xs,
    },
    legendText: {
      fontSize: responsive.fontSize.xs,
      color: '#64748b',
    },
  });
};

export default WeeklyPlanner;