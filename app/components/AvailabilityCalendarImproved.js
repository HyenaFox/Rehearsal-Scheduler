import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, PanResponder, Dimensions } from 'react-native';
import {
  DAYS,
  generateTimeSlots,
  getConsecutiveTimeslots,
  timeslotToSegmentIds,
  timeToMinutes
} from '../utils/timeslotSystem';

// Use utility function to get time slots (every 30 min from 7am to 10pm)
const TIME_SLOTS = generateTimeSlots();
const SLOT_HEIGHT = 40;
const TIME_COLUMN_WIDTH = 60;

export default function AvailabilityCalendarImproved({ 
  timeslots, 
  selectedTimeslots, 
  onSelectionChange 
}) {
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState('single'); // 'single', 'row', 'column', 'drag'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragPreview, setDragPreview] = useState(new Set());
  const calendarRef = useRef(null);
  const [calendarDimensions, setCalendarDimensions] = useState({ width: 0, height: 0 });
  
  // When selectedTimeslots changes, convert to segment format
  useEffect(() => {
    console.log('🔄 Converting selectedTimeslots to segments:', selectedTimeslots);
    
    const segments = new Set();
    
    selectedTimeslots.forEach(timeslotId => {
      // Check if it's already a segment format (day_time)
      if (timeslotId.includes('_')) {
        const parts = timeslotId.split('_');
        if (parts.length >= 2) {
          const timeStr = parts.slice(1).join('_');
          
          // If it contains AM/PM, it's a segment ID
          if (timeStr.includes('AM') || timeStr.includes('PM')) {
            segments.add(timeslotId);
          } else {
            // It's a timeslot range format like "Monday_7:00 AM_8:00 AM"
            // Convert to individual segments
            const [day, startTime, endTime] = parts;
            if (startTime && endTime) {
              const startMinutes = timeToMinutes(startTime);
              const endMinutes = timeToMinutes(endTime);
              
              for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
                const segmentTime = TIME_SLOTS.find(time => timeToMinutes(time) === minutes);
                if (segmentTime) {
                  segments.add(`${day}_${segmentTime}`);
                }
              }
            }
          }
        }
      } else {
        // Try to find the timeslot in the provided timeslots array
        const timeslot = timeslots.find(ts => (ts.id || ts._id) === timeslotId);
        if (timeslot) {
          // Convert using the timeslotToSegmentIds utility
          const segmentIds = timeslotToSegmentIds(timeslot);
          segmentIds.forEach(segmentId => segments.add(segmentId));
        }
      }
    });
    
    console.log('🔄 Converted segments:', Array.from(segments));
    setSelectedSegments(segments);
  }, [selectedTimeslots, timeslots]);

  // Get segment ID for a given position
  const getSegmentId = (dayIndex, timeIndex) => {
    const day = DAYS[dayIndex];
    const time = TIME_SLOTS[timeIndex];
    return `${day}_${time}`;
  };

  // Convert current segment selection back to timeslot format
  const convertSegmentsToTimeslotIds = (segments) => {
    if (segments.size === 0) {
      return [];
    }
    
    // Convert selected segments to consecutive timeslot format
    const segmentIds = Array.from(segments);
    const timeslots = getConsecutiveTimeslots(segmentIds);
    
    return timeslots.map(timeslot => timeslot.id);
  };

  // Convert screen coordinates to grid position
  const getGridPosition = (x, y) => {
    if (!calendarDimensions.width) return null;
    
    const dayWidth = (calendarDimensions.width - TIME_COLUMN_WIDTH) / DAYS.length;
    const dayIndex = Math.floor((x - TIME_COLUMN_WIDTH) / dayWidth);
    const timeIndex = Math.floor(y / SLOT_HEIGHT);
    
    if (dayIndex >= 0 && dayIndex < DAYS.length && timeIndex >= 0 && timeIndex < TIME_SLOTS.length) {
      return { dayIndex, timeIndex };
    }
    return null;
  };

  // Calculate drag selection area
  const getDragSelectionArea = () => {
    if (!isDragging || !dragStart || !dragEnd) return new Set();
    
    const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minTime = Math.min(dragStart.timeIndex, dragEnd.timeIndex);
    const maxTime = Math.max(dragStart.timeIndex, dragEnd.timeIndex);
    
    const area = new Set();
    for (let dayIdx = minDay; dayIdx <= maxDay; dayIdx++) {
      for (let timeIdx = minTime; timeIdx <= maxTime; timeIdx++) {
        area.add(getSegmentId(dayIdx, timeIdx));
      }
    }
    return area;
  };

  // Pan responder for drag selection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => selectionMode === 'drag',
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return selectionMode === 'drag' && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => false,
    
    onPanResponderGrant: (evt) => {
      if (selectionMode !== 'drag' || !calendarRef.current) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      const position = getGridPosition(locationX, locationY);
      
      if (position) {
        setIsDragging(true);
        setDragStart(position);
        setDragEnd(position);
        setDragPreview(new Set([getSegmentId(position.dayIndex, position.timeIndex)]));
      }
    },
    
    onPanResponderMove: (evt) => {
      if (!isDragging || !dragStart || selectionMode !== 'drag') return;
      
      const { locationX, locationY } = evt.nativeEvent;
      const position = getGridPosition(locationX, locationY);
      
      if (position) {
        setDragEnd(position);
        setDragPreview(getDragSelectionArea());
      }
    },
    
    onPanResponderRelease: () => {
      if (!isDragging || !dragStart || !dragEnd) return;
      
      // Apply the selection
      const selectionArea = getDragSelectionArea();
      const newSelection = new Set(selectedSegments);
      
      // Toggle all segments in the selection area
      selectionArea.forEach(segmentId => {
        if (newSelection.has(segmentId)) {
          newSelection.delete(segmentId);
        } else {
          newSelection.add(segmentId);
        }
      });
      
      setSelectedSegments(newSelection);
      
      // Convert to timeslot format and notify parent
      const timeslotIds = convertSegmentsToTimeslotIds(newSelection);
      if (onSelectionChange) {
        onSelectionChange(timeslotIds);
      }
      
      // Reset drag state
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setDragPreview(new Set());
    },
  });

  // Handle different selection modes
  const handleSegmentPress = (dayIndex, timeIndex) => {
    if (selectionMode === 'drag') return; // Don't handle press in drag mode
    
    const segmentId = getSegmentId(dayIndex, timeIndex);
    const newSelection = new Set(selectedSegments);
    
    if (selectionMode === 'single') {
      // Single cell selection
      if (newSelection.has(segmentId)) {
        newSelection.delete(segmentId);
      } else {
        newSelection.add(segmentId);
      }
    } else if (selectionMode === 'row') {
      // Select entire time row across all days
      const time = TIME_SLOTS[timeIndex];
      let hasAllSelected = true;
      
      // Check if all days for this time are selected
      for (let dIdx = 0; dIdx < DAYS.length; dIdx++) {
        const segId = getSegmentId(dIdx, timeIndex);
        if (!newSelection.has(segId)) {
          hasAllSelected = false;
          break;
        }
      }
      
      // Toggle all segments in this row
      for (let dIdx = 0; dIdx < DAYS.length; dIdx++) {
        const segId = getSegmentId(dIdx, timeIndex);
        if (hasAllSelected) {
          newSelection.delete(segId);
        } else {
          newSelection.add(segId);
        }
      }
    } else if (selectionMode === 'column') {
      // Select entire day column
      const day = DAYS[dayIndex];
      let hasAllSelected = true;
      
      // Check if all times for this day are selected
      for (let tIdx = 0; tIdx < TIME_SLOTS.length; tIdx++) {
        const segId = getSegmentId(dayIndex, tIdx);
        if (!newSelection.has(segId)) {
          hasAllSelected = false;
          break;
        }
      }
      
      // Toggle all segments in this column
      for (let tIdx = 0; tIdx < TIME_SLOTS.length; tIdx++) {
        const segId = getSegmentId(dayIndex, tIdx);
        if (hasAllSelected) {
          newSelection.delete(segId);
        } else {
          newSelection.add(segId);
        }
      }
    }
    
    // Update the selected segments state
    setSelectedSegments(newSelection);
    
    // Convert to timeslot format and notify parent
    const timeslotIds = convertSegmentsToTimeslotIds(newSelection);
    
    // Call the parent's selection change handler
    if (onSelectionChange) {
      onSelectionChange(timeslotIds);
    }
  };

  // Handle selection mode change
  const handleSelectionModeChange = () => {
    const modes = ['single', 'row', 'column', 'drag'];
    const currentIndex = modes.indexOf(selectionMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setSelectionMode(modes[nextIndex]);
    
    const modeLabels = {
      'single': 'Single Cell Selection',
      'row': 'Select Entire Time Row',
      'column': 'Select Entire Day Column',
      'drag': 'Drag to Select Area'
    };
    
    Alert.alert(
      'Selection Mode Changed',
      `Now in: ${modeLabels[modes[nextIndex]]}`,
      [{ text: 'OK' }]
    );
  };

  const clearSelection = () => {
    setSelectedSegments(new Set());
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const onCalendarLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setCalendarDimensions({ width, height });
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Selection controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.modeButton}
          onPress={handleSelectionModeChange}
        >
          <Text style={styles.modeButtonText}>
            Mode: {selectionMode === 'single' ? '1️⃣' : selectionMode === 'row' ? '↔️' : selectionMode === 'column' ? '↕️' : '🎯'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearSelection}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.timeCol}>
          <Text style={styles.headerText}>Time</Text>
        </View>
        {DAYS.map(day => (
          <View style={styles.headerCell} key={day}>
            <Text style={styles.headerText}>{day.slice(0,3)}</Text>
          </View>
        ))}
      </View>

      {/* Calendar body */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View 
          style={styles.calendarBody} 
          ref={calendarRef}
          onLayout={onCalendarLayout}
          {...panResponder.panHandlers}
        >
          {/* Time labels column */}
          <View style={styles.timeColumn}>
            {TIME_SLOTS.map((time, timeIndex) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeSlot, { height: SLOT_HEIGHT }]}
                onPress={() => selectionMode === 'row' && handleSegmentPress(0, timeIndex)}
              >
                <Text style={styles.timeText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Day columns */}
          {DAYS.map((day, dayIndex) => (
            <View key={day} style={styles.dayColumn}>
              {/* Column header for quick selection */}
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => selectionMode === 'column' && handleSegmentPress(dayIndex, 0)}
              >
                <Text style={styles.dayHeaderText}>{day}</Text>
              </TouchableOpacity>
              
              {/* Grid cells */}
              {TIME_SLOTS.map((time, timeIndex) => {
                const segmentId = getSegmentId(dayIndex, timeIndex);
                const isSelected = selectedSegments.has(segmentId);
                const isInDragPreview = dragPreview.has(segmentId);
                
                return (
                  <TouchableOpacity
                    key={time} 
                    style={[
                      styles.gridCell, 
                      { height: SLOT_HEIGHT },
                      styles.hasTimeslot,
                      isSelected && styles.selectedCell,
                      isInDragPreview && styles.dragPreviewCell
                    ]}
                    onPress={() => handleSegmentPress(dayIndex, timeIndex)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.timeslotLabel, 
                      (isSelected || isInDragPreview) && styles.selectedLabel
                    ]}>
                      {time}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectionIndicator}>
                        <Text style={styles.selectionIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Selected: {selectedSegments.size} time slots
        </Text>
        <Text style={styles.instructionText}>
          Mode: {selectionMode === 'single' ? 'Single cell' : selectionMode === 'row' ? 'Entire row' : selectionMode === 'column' ? 'Entire column' : 'Drag to select'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    margin: 8,
    maxHeight: 500,
    overflow: 'hidden',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#e0e7ef',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ef',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    height: 40,
  },
  timeCol: {
    width: TIME_COLUMN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  calendarBody: {
    flexDirection: 'row',
    minHeight: TIME_SLOTS.length * SLOT_HEIGHT,
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeSlot: {
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  dayColumn: {
    flex: 1,
  },
  dayHeader: {
    height: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayHeaderText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  gridCell: {
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hasTimeslot: {
    backgroundColor: '#f8fafc',
  },
  selectedCell: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  dragPreviewCell: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0ea5e9',
    borderWidth: 1,
  },
  timeslotLabel: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#1e40af',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  instructions: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  instructionText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
  },
});
