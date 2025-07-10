import { useRef, useState } from 'react';
import { Alert, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Helper to get all days of the week (excluding Friday)
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];

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

// Helper to get time slots (every 30 min from 5pm to 11pm) - matches the new system
const getTimeSlots = () => {
  const slots = [];
  for (let hour = 17; hour <= 22; hour++) { // 5 PM (17) to 10 PM (22)
    for (let minute = 0; minute < 60; minute += 30) {
      const hour12 = hour > 12 ? hour - 12 : hour;
      const period = 'PM';
      const minute12 = minute.toString().padStart(2, '0');
      
      // Skip 11:30 PM to end at 11:00 PM
      if (hour === 22 && minute === 30) continue;
      
      slots.push(`${hour12}:${minute12} ${period}`);
    }
  }
  return slots;
};

const TIME_SLOTS = getTimeSlots();
const SLOT_HEIGHT = 40;

export default function TimeslotCalendar({ 
  timeslots, 
  onTimeslotUpdate, 
  onTimeslotDelete, 
  onTimeslotMove, 
  onTimeslotResize,
  isAdmin = false,
  isDraggable = false 
}) {
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [resizingSlot, setResizingSlot] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const layoutRef = useRef(null);
  // Map timeslots by day
  const slotsByDay = {};
  for (const day of DAYS) slotsByDay[day] = [];
  for (const ts of timeslots) {
    if (DAYS.includes(ts.day)) slotsByDay[ts.day].push(ts);
  }

  const handleTimeslotPress = (timeslot) => {
    if (isAdmin && onTimeslotUpdate) {
      onTimeslotUpdate(timeslot);
    }
  };

  const handleTimeslotLongPress = (timeslot) => {
    if (isAdmin && onTimeslotDelete) {
      Alert.alert(
        'Delete Timeslot',
        `Are you sure you want to delete "${timeslot.label}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onTimeslotDelete(timeslot) }
        ]
      );
    }
  };

  const createDragHandlers = (slot) => {
    if (!isDraggable) return {};

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt, gestureState) => {
        setDraggedSlot(slot);
        setDragOffset({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        setDragOffset({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (layoutRef.current) {
          layoutRef.current.measure((x, y, width, height, pageXOffset, pageYOffset) => {
            // Calculate which day and time the slot was moved to
            const dayWidth = (width - 60) / 7; // Account for time column
            const relativeX = evt.nativeEvent.pageX - pageXOffset - 60;
            const relativeY = evt.nativeEvent.pageY - pageYOffset - 40; // Account for header
            
            const newDayIndex = Math.max(0, Math.min(6, Math.floor(relativeX / dayWidth)));
            const newTimeIndex = Math.max(0, Math.min(TIME_SLOTS.length - 1, Math.floor(relativeY / SLOT_HEIGHT)));
            
            const newDay = DAYS[newDayIndex];
            const newStartTime = TIME_SLOTS[newTimeIndex];
            
            if (onTimeslotMove && (newDay !== slot.day || newStartTime !== slot.startTime)) {
              onTimeslotMove(slot, newDay, newStartTime);
            }
          });
        }
        
        setDraggedSlot(null);
        setDragOffset({ x: 0, y: 0 });
      },
    });

    return panResponder.panHandlers;
  };

  const createResizeHandlers = (slot, direction) => {
    if (!isDraggable) return {};

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setResizingSlot({ slot, direction });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Visual feedback for resize - could add preview here
      },
      onPanResponderRelease: (evt, gestureState) => {
        const timeChange = Math.round(gestureState.dy / SLOT_HEIGHT) * 30; // 30 min increments
        
        if (onTimeslotResize && Math.abs(timeChange) > 0) {
          onTimeslotResize(slot, direction, timeChange);
        }
        
        setResizingSlot(null);
      },
    });

    return panResponder.panHandlers;
  };

  const renderTimeslotBlock = (slot, day, startRowIdx) => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    const durationMinutes = endMinutes - startMinutes;
    const height = (durationMinutes / 30) * SLOT_HEIGHT;

    const dragHandlers = createDragHandlers(slot);
    const isDragging = draggedSlot && draggedSlot.id === slot.id;
    const isResizing = resizingSlot && resizingSlot.slot.id === slot.id;

    return (
      <View
        key={`${day}-${slot.id || slot._id}`}
        style={[
          styles.slotBlock,
          {
            height: height,
            top: startRowIdx * SLOT_HEIGHT,
            backgroundColor: isDragging ? '#93c5fd' : isResizing ? '#fbbf24' : '#6ee7b7',
            borderLeftColor: isDragging ? '#3b82f6' : isResizing ? '#f59e0b' : '#10b981',
            opacity: isDragging ? 0.8 : 1,
            transform: isDragging ? [
              { translateX: dragOffset.x },
              { translateY: dragOffset.y }
            ] : [],
          }
        ]}
        {...dragHandlers}
      >
        <TouchableOpacity
          style={styles.slotContent}
          onPress={() => handleTimeslotPress(slot)}
          onLongPress={() => handleTimeslotLongPress(slot)}
        >
          <Text style={styles.slotTitle} numberOfLines={1}>{slot.label}</Text>
          <Text style={styles.slotTime} numberOfLines={1}>
            {slot.startTime} - {slot.endTime}
          </Text>
        </TouchableOpacity>
        
        {/* Resize handles for draggable timeslots */}
        {isDraggable && (
          <>
            <View 
              style={[styles.resizeHandle, styles.resizeHandleTop]} 
              {...createResizeHandlers(slot, 'start')}
            />
            <View 
              style={[styles.resizeHandle, styles.resizeHandleBottom]} 
              {...createResizeHandlers(slot, 'end')}
            />
          </>
        )}
      </View>
    );
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
      
      {/* Calendar body with time grid - wrapped in ScrollView */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        <View style={styles.calendarBody} ref={layoutRef}>
          {/* Time labels column */}
          <View style={styles.timeColumn}>
            {TIME_SLOTS.map((time, idx) => (
              <View key={time} style={[styles.timeSlot, { height: SLOT_HEIGHT }]}>
                <Text style={styles.timeText}>{time}</Text>
              </View>
            ))}
          </View>
          
          {/* Day columns */}
          {DAYS.map(day => (
            <View key={day} style={styles.dayColumn}>
              {/* Background grid */}
              {TIME_SLOTS.map((time, idx) => (
                <View key={time} style={[styles.gridCell, { height: SLOT_HEIGHT }]} />
              ))}
              
              {/* Timeslot blocks */}
              {slotsByDay[day].map(slot => {
                const startMinutes = timeToMinutes(slot.startTime);
                const startSlotIdx = TIME_SLOTS.findIndex(ts => timeToMinutes(ts) >= startMinutes);
                if (startSlotIdx >= 0) {
                  return renderTimeslotBlock(slot, day, startSlotIdx);
                }
                return null;
              })}
            </View>
          ))}
        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  calendarBody: {
    flexDirection: 'row',
    minHeight: TIME_SLOTS.length * SLOT_HEIGHT,
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
    position: 'relative',
  },
  gridCell: {
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  slotBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 6,
    borderLeftWidth: 4,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slotContent: {
    flex: 1,
    padding: 4,
  },
  slotTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  slotTime: {
    fontSize: 9,
    color: '#475569',
    marginTop: 1,
  },
  resizeHandle: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.6)',
    zIndex: 10,
  },
  resizeHandleTop: {
    top: -6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    cursor: 'ns-resize',
  },
  resizeHandleBottom: {
    bottom: -6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    cursor: 'ns-resize',
  },
});
