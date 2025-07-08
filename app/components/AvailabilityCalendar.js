import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';

// Helper to get all days of the week
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to convert time string to 24-hour format for calculations
const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  return hour24 * 60 + (minutes || 0);
};

// Helper to convert minutes back to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Helper to get time slots (every 30 min from 7am to 10pm)
const getTimeSlots = () => {
  const slots = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const minutes = h * 60 + m;
      slots.push(minutesToTime(minutes));
    }
  }
  return slots;
};

const TIME_SLOTS = getTimeSlots();
const SLOT_HEIGHT = 40;

export default function AvailabilityCalendar({ 
  timeslots, 
  selectedTimeslots, 
  onSelectionChange 
}) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(new Set(selectedTimeslots));
  
  React.useEffect(() => {
    setCurrentSelection(new Set(selectedTimeslots));
  }, [selectedTimeslots]);

  // Map timeslots by day for easy lookup
  const slotsByDay = {};
  for (const day of DAYS) slotsByDay[day] = [];
  for (const ts of timeslots) {
    if (DAYS.includes(ts.day)) slotsByDay[ts.day].push(ts);
  }

  const getTimeslotAt = (dayIndex, timeIndex) => {
    const day = DAYS[dayIndex];
    const time = TIME_SLOTS[timeIndex];
    return slotsByDay[day].find(ts => 
      timeToMinutes(ts.startTime) <= timeToMinutes(time) && 
      timeToMinutes(ts.endTime) > timeToMinutes(time)
    );
  };

  const layoutRef = useRef(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      setIsSelecting(true);
      const { pageX, pageY } = evt.nativeEvent;
      
      // Calculate which cell was tapped
      if (layoutRef.current) {
        layoutRef.current.measure((x, y, width, height, pageXOffset, pageYOffset) => {
          const relativeX = pageX - pageXOffset - 60; // Account for time column
          const relativeY = pageY - pageYOffset - 40; // Account for header
          
          const dayWidth = (width - 60) / 7;
          const dayIndex = Math.max(0, Math.min(6, Math.floor(relativeX / dayWidth)));
          const timeIndex = Math.max(0, Math.min(TIME_SLOTS.length - 1, Math.floor(relativeY / SLOT_HEIGHT)));
          
          setSelectionStart({ dayIndex, timeIndex });
          setSelectionEnd({ dayIndex, timeIndex });
        });
      }
    },
    
    onPanResponderMove: (evt) => {
      if (!isSelecting || !selectionStart) return;
      
      const { pageX, pageY } = evt.nativeEvent;
      
      if (layoutRef.current) {
        layoutRef.current.measure((x, y, width, height, pageXOffset, pageYOffset) => {
          const relativeX = pageX - pageXOffset - 60;
          const relativeY = pageY - pageYOffset - 40;
          
          const dayWidth = (width - 60) / 7;
          const dayIndex = Math.max(0, Math.min(6, Math.floor(relativeX / dayWidth)));
          const timeIndex = Math.max(0, Math.min(TIME_SLOTS.length - 1, Math.floor(relativeY / SLOT_HEIGHT)));
          
          setSelectionEnd({ dayIndex, timeIndex });
        });
      }
    },
    
    onPanResponderRelease: () => {
      if (selectionStart && selectionEnd) {
        // Calculate selection rectangle
        const startDay = Math.min(selectionStart.dayIndex, selectionEnd.dayIndex);
        const endDay = Math.max(selectionStart.dayIndex, selectionEnd.dayIndex);
        const startTime = Math.min(selectionStart.timeIndex, selectionEnd.timeIndex);
        const endTime = Math.max(selectionStart.timeIndex, selectionEnd.timeIndex);
        
        const newSelection = new Set(currentSelection);
        
        // Toggle timeslots in the selection area
        for (let dayIdx = startDay; dayIdx <= endDay; dayIdx++) {
          for (let timeIdx = startTime; timeIdx <= endTime; timeIdx++) {
            const timeslot = getTimeslotAt(dayIdx, timeIdx);
            if (timeslot) {
              const timeslotId = timeslot.id || timeslot._id;
              if (newSelection.has(timeslotId)) {
                newSelection.delete(timeslotId);
              } else {
                newSelection.add(timeslotId);
              }
            }
          }
        }
        
        setCurrentSelection(newSelection);
        onSelectionChange(Array.from(newSelection));
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    },
  });

  const isInSelectionArea = (dayIndex, timeIndex) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false;
    
    const startDay = Math.min(selectionStart.dayIndex, selectionEnd.dayIndex);
    const endDay = Math.max(selectionStart.dayIndex, selectionEnd.dayIndex);
    const startTime = Math.min(selectionStart.timeIndex, selectionEnd.timeIndex);
    const endTime = Math.max(selectionStart.timeIndex, selectionEnd.timeIndex);
    
    return dayIndex >= startDay && dayIndex <= endDay && 
           timeIndex >= startTime && timeIndex <= endTime;
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.timeCol}><Text></Text></View>
        {DAYS.map(day => (
          <View style={styles.headerCell} key={day}>
            <Text style={styles.headerText}>{day.slice(0,3)}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar body with time grid */}
      <View style={styles.calendarBody} ref={layoutRef} {...panResponder.panHandlers}>
        {/* Time labels column */}
        <View style={styles.timeColumn}>
          {TIME_SLOTS.map((time, idx) => (
            <View key={time} style={[styles.timeSlot, { height: SLOT_HEIGHT }]}>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          ))}
        </View>
        
        {/* Day columns */}
        {DAYS.map((day, dayIndex) => (
          <View key={day} style={styles.dayColumn}>
            {/* Grid cells with timeslots */}
            {TIME_SLOTS.map((time, timeIndex) => {
              const timeslot = getTimeslotAt(dayIndex, timeIndex);
              const isSelected = timeslot && currentSelection.has(timeslot.id || timeslot._id);
              const isInSelection = isInSelectionArea(dayIndex, timeIndex);
              
              return (
                <View 
                  key={time} 
                  style={[
                    styles.gridCell, 
                    { height: SLOT_HEIGHT },
                    timeslot && styles.hasTimeslot,
                    isSelected && styles.selectedCell,
                    isInSelection && styles.selectionPreview
                  ]}
                >
                  {timeslot && (
                    <Text style={[styles.timeslotLabel, isSelected && styles.selectedLabel]}>
                      {timeslot.label}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Drag to select your available timeslots
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 8,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ef',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    height: 40,
  },
  headerCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#334155',
    fontSize: 12,
  },
  calendarBody: {
    flexDirection: 'row',
    flex: 1,
  },
  timeColumn: {
    width: 60,
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeSlot: {
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
  },
  dayColumn: {
    flex: 1,
  },
  gridCell: {
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasTimeslot: {
    backgroundColor: '#f1f5f9',
  },
  selectedCell: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  selectionPreview: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0ea5e9',
  },
  timeslotLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#1e40af',
    fontWeight: 'bold',
  },
  instructions: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
