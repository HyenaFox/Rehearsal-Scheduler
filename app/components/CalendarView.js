import React, { useState, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HOUR_HEIGHT = 60;
const HEADER_HEIGHT = 50;
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Convert time string to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  return hour24 * 60 + minutes;
};

// Convert minutes to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `12:${mins.toString().padStart(2, '0')} AM`;
  if (hours < 12) return `${hours}:${mins.toString().padStart(2, '0')} AM`;
  if (hours === 12) return `12:${mins.toString().padStart(2, '0')} PM`;
  return `${hours - 12}:${mins.toString().padStart(2, '0')} PM`;
};

const CalendarTimeslotItem = ({ timeslot, onEdit, onDelete, onDragEnd, isAdmin }) => {
  const [dragState, setDragState] = useState({ isDragging: false, type: null });
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  
  const startMinutes = timeToMinutes(timeslot.startTime);
  const endMinutes = timeToMinutes(timeslot.endTime);
  const duration = endMinutes - startMinutes;
  
  const topPosition = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (duration / 60) * HOUR_HEIGHT;
  
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: false }
  );
  
  const onHandlerStateChange = (event) => {
    const { state, translationY } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      setDragState({ isDragging: true, type: 'move' });
    } else if (state === State.END || state === State.CANCELLED) {
      setDragState({ isDragging: false, type: null });
      
      // Calculate new time based on drag distance
      const minutesMoved = (translationY / HOUR_HEIGHT) * 60;
      const newStartMinutes = Math.max(0, Math.min(1380, startMinutes + minutesMoved)); // 0-23 hours
      const newEndMinutes = newStartMinutes + duration;
      
      if (newEndMinutes <= 1440) { // Don't go past midnight
        const newStartTime = minutesToTime(newStartMinutes);
        const newEndTime = minutesToTime(newEndMinutes);
        
        onDragEnd?.({
          ...timeslot,
          startTime: newStartTime,
          endTime: newEndTime
        });
      }
      
      // Reset animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const getGradientStyle = () => {
    const hue = (startMinutes / 1440) * 360; // Full color wheel over 24 hours
    return {
      backgroundColor: `hsl(${hue}, 70%, 85%)`,
      borderLeftColor: `hsl(${hue}, 80%, 60%)`,
    };
  };
  
  if (!isAdmin) {
    // Read-only view for non-admins
    return (
      <View style={[
        styles.timeslotBlock,
        getGradientStyle(),
        { top: topPosition, height: Math.max(height, 30) }
      ]}>
        <Text style={styles.timeslotTitle}>{timeslot.label}</Text>
        <Text style={styles.timeslotTime}>
          {timeslot.startTime} - {timeslot.endTime}
        </Text>
        {timeslot.description && (
          <Text style={styles.timeslotDescription} numberOfLines={2}>
            {timeslot.description}
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={[
        styles.timeslotBlock,
        getGradientStyle(),
        {
          top: topPosition,
          height: Math.max(height, 30),
          transform: [{ translateY }, { scaleY }],
          opacity: dragState.isDragging ? 0.8 : 1,
          shadowOpacity: dragState.isDragging ? 0.3 : 0.1,
        }
      ]}>
        <TouchableOpacity 
          style={styles.timeslotContent}
          onPress={() => onEdit?.(timeslot)}
          onLongPress={() => onDelete?.(timeslot)}
        >
          <Text style={styles.timeslotTitle}>{timeslot.label}</Text>
          <Text style={styles.timeslotTime}>
            {timeslot.startTime} - {timeslot.endTime}
          </Text>
          {timeslot.description && (
            <Text style={styles.timeslotDescription} numberOfLines={2}>
              {timeslot.description}
            </Text>
          )}
          {dragState.isDragging && (
            <Text style={styles.dragIndicator}>↕️ Dragging...</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const CalendarView = ({ timeslots, onEditTimeslot, onDeleteTimeslot, onUpdateTimeslot, isAdmin }) => {
  const groupedTimeslots = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = timeslots.filter(ts => ts.day === day);
    return acc;
  }, {});
  
  const handleDragEnd = async (updatedTimeslot) => {
    try {
      await onUpdateTimeslot?.(updatedTimeslot);
    } catch (error) {
      console.error('Error updating timeslot:', error);
    }
  };
  
  const renderTimeLabels = () => {
    const hours = [];
    for (let i = 6; i <= 23; i++) { // 6 AM to 11 PM
      const time = i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : i === 0 ? '12 AM' : `${i} AM`;
      hours.push(
        <View key={i} style={[styles.timeLabel, { top: ((i - 6) * HOUR_HEIGHT) }]}>
          <Text style={styles.timeLabelText}>{time}</Text>
        </View>
      );
    }
    return hours;
  };
  
  return (
    <View style={styles.calendarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {/* Time labels column */}
          <View style={styles.timeColumn}>
            {renderTimeLabels()}
          </View>
          
          {/* Days columns */}
          {DAYS_OF_WEEK.map((day, dayIndex) => (
            <View key={day} style={styles.dayColumn}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day.slice(0, 3)}</Text>
              </View>
              
              <View style={styles.dayContent}>
                {/* Hour grid lines */}
                {Array.from({ length: 18 }, (_, i) => (
                  <View
                    key={i}
                    style={[styles.hourLine, { top: i * HOUR_HEIGHT }]}
                  />
                ))}
                
                {/* Timeslots for this day */}
                {groupedTimeslots[day]?.map(timeslot => (
                  <CalendarTimeslotItem
                    key={timeslot.id || timeslot._id}
                    timeslot={timeslot}
                    onEdit={onEditTimeslot}
                    onDelete={onDeleteTimeslot}
                    onDragEnd={handleDragEnd}
                    isAdmin={isAdmin}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  calendarGrid: {
    flexDirection: 'row',
    height: 18 * HOUR_HEIGHT + HEADER_HEIGHT, // 6 AM to 11 PM + header
  },
  timeColumn: {
    width: 60,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  timeLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeLabelText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dayColumn: {
    width: (SCREEN_WIDTH - 60) / 4, // Show 4 days at a time, scroll for more
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  dayHeader: {
    height: HEADER_HEIGHT,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dayContent: {
    flex: 1,
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  timeslotBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    minHeight: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeslotContent: {
    flex: 1,
    padding: 8,
  },
  timeslotTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  timeslotTime: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  timeslotDescription: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
  },
  dragIndicator: {
    fontSize: 8,
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default CalendarView;
