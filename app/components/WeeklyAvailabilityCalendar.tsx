import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Actor {
  id: string;
  name: string;
  availability: string[];
}

interface WeeklyAvailabilityCalendarProps {
  actors: Actor[];
  onTimeSlotHover?: (day: number, hour: number, minute: number, actors: Actor[]) => void;
  onTimeSlotSelect?: (day: number, hour: number, minute: number, actors: Actor[]) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  actors: Actor[];
  day: string;
  time: string;
}

const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
const rehearsalDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const WeeklyAvailabilityCalendar: React.FC<WeeklyAvailabilityCalendarProps> = ({ 
  actors,
  onTimeSlotHover,
  onTimeSlotSelect
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    actors: [],
    day: '',
    time: ''
  });

  // Debug logging for actors data
  React.useEffect(() => {
    console.log('🎭 WeeklyAvailabilityCalendar received actors:', actors.length);
    actors.forEach(actor => {
      console.log(`🎭 Actor ${actor.name}:`, {
        id: actor.id,
        availabilityCount: actor.availability ? actor.availability.length : 'no availability',
        availability: actor.availability
      });
    });
  }, [actors]);

  const formatTime = (hour: number, minute: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${amPm}`;
  };

  const formatDay = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    return days[dayIndex];
  };

  const handlePress = (dayIndex: number, hour: number, minute: number, availableActors: Actor[]) => {
    onTimeSlotSelect?.(dayIndex, hour, minute, availableActors);
  };

  const generateTimeSlots = () => {
    const slots: { day: number; hour: number; minute: number }[] = [];
    
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

  const getActorsForSlot = (day: number, hour: number, minute: number): Actor[] => {
    const availableActors = actors.filter(actor => {
      if (!actor.availability || !Array.isArray(actor.availability)) {
        return false;
      }
      
      return actor.availability.some(slot => {
        try {
          const date = new Date(slot);
          const slotDay = date.getDay();
          const slotHour = date.getHours();
          const slotMinute = date.getMinutes();
          
          return slotDay === day && slotHour === hour && slotMinute === minute;
        } catch {
          return false;
        }
      });
    });
    
    // Only log if we find actors (reduce console spam)
    if (availableActors.length > 0) {
      console.log(`✅ Found ${availableActors.length} actors for Day ${day} at ${hour}:${minute}:`, availableActors.map(a => a.name));
    }
    
    return availableActors;
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

  const getSlotIntensity = (actorCount: number, maxActors: number) => {
    // Use absolute actor count thresholds instead of relative percentages
    // This ensures 1 actor is always "very light blue" regardless of max actors
    if (actorCount === 0) return 0;
    if (actorCount === 1) return 0.2;  // Very light blue for 1 actor
    if (actorCount === 2) return 0.4;  // Light blue for 2 actors  
    if (actorCount === 3) return 0.6;  // Medium blue for 3 actors
    if (actorCount >= 4) return 0.8;   // Darker blue for 4+ actors
    return Math.min(actorCount / maxActors, 1); // Fallback to relative calculation
  };

  const getSlotBackgroundColor = (intensity: number) => {
    if (intensity === 0) return '#ffffff'; // Clean white for empty slots
    if (intensity <= 0.25) return '#f0f9ff'; // Very light blue
    if (intensity <= 0.5) return '#e0f2fe';  // Light blue
    if (intensity <= 0.75) return '#bae6fd'; // Medium blue
    return '#7dd3fc'; // Brighter blue for full availability
  };

  // Calculate max actors for intensity scaling
  const maxActorsInAnySlot = Math.max(
    ...timeSlots.map(slot => getActorsForSlot(slot.day, slot.hour, slot.minute).length),
    1
  );

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
                  const availableActors = getActorsForSlot(dayIndex, timeGroup.hour, timeGroup.minute);
                  const intensity = getSlotIntensity(availableActors.length, maxActorsInAnySlot);
                  const backgroundColor = getSlotBackgroundColor(intensity);
                  
                  return (
                    <Pressable
                      key={dayIndex}
                      style={({ hovered }: any) => [
                        styles.timeSlot,
                        { backgroundColor },
                        availableActors.length > 0 && styles.hasActorsSlot,
                        hovered && availableActors.length > 0 && styles.hoveredSlot
                      ]}
                      onPress={() => handlePress(dayIndex, timeGroup.hour, timeGroup.minute, availableActors)}
                      onHoverIn={(event: any) => {
                        if (availableActors.length > 0) {
                          // Get the element's position for tooltip placement
                          const target = event.target || event.currentTarget;
                          const rect = target.getBoundingClientRect();
                          
                          setTooltip({
                            visible: true,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 60, // Position above the element
                            actors: availableActors,
                            day: formatDay(dayIndex),
                            time: formatTime(timeGroup.hour, timeGroup.minute)
                          });
                          onTimeSlotHover?.(dayIndex, timeGroup.hour, timeGroup.minute, availableActors);
                        }
                      }}
                      onHoverOut={() => {
                        setTooltip(prev => ({ ...prev, visible: false }));
                      }}
                    >
                      {/* Show actor count for slots with actors */}
                      {availableActors.length > 0 && (
                        <Text style={styles.actorCount}>{availableActors.length}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Tooltip */}
        {tooltip.visible && (
          <View style={[styles.tooltip, { top: tooltip.y, left: tooltip.x }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              {tooltip.day} at {tooltip.time}
            </Text>
            {tooltip.actors.map((actor, index) => (
              <Text key={actor.id} style={{ color: '#fff', fontSize: 11 }}>
                {actor.name}
              </Text>
            ))}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  dayHeaderContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  timeColumnHeader: {
    width: 70,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  dayHeader: {
    flex: 1,
    minWidth: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    position: 'relative',
  },
  hasActorsSlot: {
    borderWidth: 2,
    borderColor: '#000000', // Changed to black
  },
  hoveredSlot: {
    backgroundColor: '#e6f3ff', // Light blue on hover
  },
  actorCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  tooltip: {
    position: 'fixed', // Use fixed positioning for web
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
    zIndex: 1000,
    minWidth: 120,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ translateX: -60 }], // Center horizontally
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

export default WeeklyAvailabilityCalendar;
