import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Dimensions,
  Platform 
} from 'react-native';
import { responsive, getScreenSize } from '../utils/responsive';

interface AvailabilityPeriod {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ResponsiveAvailabilityCalendarProps {
  onTimeSlotSelect: (day: number, hour: number, minute: number) => void;
  selectedSlots?: string[];
  readOnly?: boolean;
  availabilityPeriods?: AvailabilityPeriod[];
  title?: string;
}

const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
const rehearsalDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const ResponsiveAvailabilityCalendar: React.FC<ResponsiveAvailabilityCalendarProps> = ({ 
  onTimeSlotSelect, 
  selectedSlots = [], 
  readOnly = false,
  availabilityPeriods = [],
  title = "Select Your Availability"
}) => {
  const screenSize = getScreenSize();
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
  const styles = createResponsiveStyles(screenSize);

  const generateTimeSlots = () => {
    const slots: { day: number; hour: number; minute: number; timeLabel: string }[] = [];
    
    // Generate slots for rehearsal days and times (6:00 PM to 11:30 PM)
    for (const day of rehearsalDays) {
      for (let hour = 18; hour <= 23; hour++) { // 6 PM (18) to 11 PM (23)
        for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
          // For hour 23 (11 PM), include both 11:00 PM and 11:30 PM
          if (hour === 23 && minute > 30) {
            break; // Stop after 11:30 PM
          }
          
          const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({ day, hour, minute, timeLabel });
        }
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSlotSelected = (day: number, hour: number, minute: number) => {
    const slotKey = `${day}-${hour}-${minute}`;
    return selectedSlots.includes(slotKey);
  };

  const isSlotAvailable = (day: number, hour: number, minute: number) => {
    if (availabilityPeriods.length === 0) return true;
    
    const timeInMinutes = hour * 60 + minute;
    
    return availabilityPeriods.some(period => {
      if (period.dayOfWeek !== day) return false;
      
      const [startHour, startMinute] = period.startTime.split(':').map(Number);
      const [endHour, endMinute] = period.endTime.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return timeInMinutes >= startTimeInMinutes && timeInMinutes < endTimeInMinutes;
    });
  };

  const handleTimeSlotPress = (day: number, hour: number, minute: number) => {
    if (readOnly) return;
    onTimeSlotSelect(day, hour, minute);
  };

  const getSlotsByDay = (day: number) => {
    return timeSlots.filter(slot => slot.day === day);
  };

  const getUniqueTimeLabels = () => {
    return [...new Set(timeSlots.map(slot => slot.timeLabel))].sort();
  };

  const GridView = () => (
    <View style={styles.container}>
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
      <ScrollView style={styles.gridScrollView} showsVerticalScrollIndicator={false}>
        {getUniqueTimeLabels().map(timeLabel => {
          const [hour, minute] = timeLabel.split(':').map(Number);
          
          return (
            <View key={timeLabel} style={styles.timeRow}>
              <View style={styles.timeCell}>
                <Text style={styles.timeText}>{timeLabel}</Text>
              </View>
              
              {rehearsalDays.map(day => {
                const isSelected = isSlotSelected(day, hour, minute);
                const isAvailable = isSlotAvailable(day, hour, minute);
                
                return (
                  <TouchableOpacity
                    key={`${day}-${timeLabel}`}
                    style={[
                      styles.slotCell,
                      isSelected && styles.selectedSlot,
                      !isAvailable && styles.unavailableSlot,
                      readOnly && styles.readOnlySlot
                    ]}
                    onPress={() => handleTimeSlotPress(day, hour, minute)}
                    disabled={readOnly || !isAvailable}
                    activeOpacity={0.7}
                  >
                    <View style={styles.slotIndicator}>
                      {isSelected && <Text style={styles.selectedIndicator}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const ListView = () => (
    <ScrollView style={styles.listScrollView} showsVerticalScrollIndicator={false}>
      {rehearsalDayNames.map((dayName, dayIndex) => {
        const daySlots = getSlotsByDay(rehearsalDays[dayIndex]);
        
        return (
          <View key={dayIndex} style={styles.daySection}>
            <Text style={styles.daySectionTitle}>{dayName}</Text>
            
            <View style={styles.timeSlotsGrid}>
              {daySlots.map(slot => {
                const isSelected = isSlotSelected(slot.day, slot.hour, slot.minute);
                const isAvailable = isSlotAvailable(slot.day, slot.hour, slot.minute);
                
                return (
                  <TouchableOpacity
                    key={`${slot.day}-${slot.hour}-${slot.minute}`}
                    style={[
                      styles.timeSlotButton,
                      isSelected && styles.selectedTimeSlot,
                      !isAvailable && styles.unavailableTimeSlot,
                      readOnly && styles.readOnlyTimeSlot
                    ]}
                    onPress={() => handleTimeSlotPress(slot.day, slot.hour, slot.minute)}
                    disabled={readOnly || !isAvailable}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      isSelected && styles.selectedTimeSlotText,
                      !isAvailable && styles.unavailableTimeSlotText
                    ]}>
                      {slot.timeLabel}
                      {isSelected && ' ✓'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        
        {/* View toggle for mobile */}
        {screenSize.isPhone && (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, selectedView === 'grid' && styles.activeToggle]}
              onPress={() => setSelectedView('grid')}
            >
              <Text style={[styles.toggleText, selectedView === 'grid' && styles.activeToggleText]}>
                Grid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, selectedView === 'list' && styles.activeToggle]}
              onPress={() => setSelectedView('list')}
            >
              <Text style={[styles.toggleText, selectedView === 'list' && styles.activeToggleText]}>
                List
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f1f5f9' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        {availabilityPeriods.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fca5a5' }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        )}
      </View>

      {/* Calendar Content */}
      {screenSize.isPhone && selectedView === 'list' ? <ListView /> : <GridView />}
    </View>
  );
};

const createResponsiveStyles = (screenSize: any) => {
  const cellSize = screenSize.isPhone ? 35 : 45;
  const fontSize = screenSize.isPhone ? 10 : 12;
  
  return StyleSheet.create({
    wrapper: {
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: responsive.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      flexWrap: screenSize.isPhone ? 'wrap' : 'nowrap',
    },
    title: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: screenSize.isPhone ? responsive.spacing.sm : 0,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      borderRadius: 6,
      padding: 2,
      marginTop: screenSize.isPhone ? responsive.spacing.sm : 0,
    },
    toggleButton: {
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.xs,
      borderRadius: 4,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeToggle: {
      backgroundColor: '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleText: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      fontWeight: '500',
    },
    activeToggleText: {
      color: '#1e293b',
      fontWeight: '600',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      backgroundColor: '#f8fafc',
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
    container: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      backgroundColor: '#f8fafc',
    },
    timeHeaderCell: {
      width: screenSize.isPhone ? 50 : 60,
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
    gridScrollView: {
      flex: 1,
      maxHeight: screenSize.isPhone ? 300 : 400,
    },
    timeRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    timeCell: {
      width: screenSize.isPhone ? 50 : 60,
      height: cellSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
      backgroundColor: '#f8fafc',
    },
    timeText: {
      fontSize: fontSize,
      color: '#64748b',
      fontWeight: '500',
    },
    slotCell: {
      flex: 1,
      height: cellSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
      backgroundColor: '#f1f5f9',
      minHeight: responsive.touchTarget.small,
    },
    selectedSlot: {
      backgroundColor: '#3b82f6',
    },
    unavailableSlot: {
      backgroundColor: '#fca5a5',
    },
    readOnlySlot: {
      opacity: 0.7,
    },
    slotIndicator: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedIndicator: {
      color: '#ffffff',
      fontSize: responsive.fontSize.sm,
      fontWeight: 'bold',
    },
    listScrollView: {
      flex: 1,
      padding: responsive.spacing.md,
    },
    daySection: {
      marginBottom: responsive.spacing.lg,
    },
    daySectionTitle: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: responsive.spacing.sm,
    },
    timeSlotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.spacing.xs,
    },
    timeSlotButton: {
      backgroundColor: '#f1f5f9',
      borderRadius: 8,
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.xs,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: screenSize.isPhone ? '30%' : 'auto',
    },
    selectedTimeSlot: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
    },
    unavailableTimeSlot: {
      backgroundColor: '#fca5a5',
      borderColor: '#f87171',
    },
    readOnlyTimeSlot: {
      opacity: 0.7,
    },
    timeSlotText: {
      fontSize: responsive.fontSize.sm,
      color: '#374151',
      fontWeight: '500',
      textAlign: 'center',
    },
    selectedTimeSlotText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    unavailableTimeSlotText: {
      color: '#7f1d1d',
    },
  });
};

export default ResponsiveAvailabilityCalendar;