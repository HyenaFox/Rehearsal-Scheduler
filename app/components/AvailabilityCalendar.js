import { useEffect, useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function AvailabilityCalendar({ 
  timeslots, 
  selectedTimeslots, 
  onSelectionChange 
}) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  
  // Store selected segments as a Set - parse from selected timeslots
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  
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

  // Handle click-to-select individual segments
  const handleSegmentClick = (dayIndex, timeIndex) => {
    const segmentId = getSegmentId(dayIndex, timeIndex);
    const newSelection = new Set(selectedSegments);
    
    console.log('🎯 Segment clicked:', segmentId);
    console.log('🎯 Current selection size:', selectedSegments.size);
    console.log('🎯 Current selection:', Array.from(selectedSegments));
    
    if (newSelection.has(segmentId)) {
      console.log('🎯 Removing segment:', segmentId);
      newSelection.delete(segmentId);
    } else {
      console.log('🎯 Adding segment:', segmentId);
      newSelection.add(segmentId);
    }
    
    console.log('🎯 New selection size:', newSelection.size);
    console.log('🎯 New selection:', Array.from(newSelection));
    
    // Update the selected segments state immediately
    setSelectedSegments(newSelection);
    
    // Convert to timeslot format and notify parent
    const timeslotIds = convertSegmentsToTimeslotIds(newSelection);
    console.log('🎯 Converted to timeslots:', timeslotIds);
    
    // Call the parent's selection change handler
    if (onSelectionChange) {
      onSelectionChange(timeslotIds);
    }
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
        
        const newSelection = new Set(selectedSegments);
        
        // Toggle segments in the selection area
        for (let dayIdx = startDay; dayIdx <= endDay; dayIdx++) {
          for (let timeIdx = startTime; timeIdx <= endTime; timeIdx++) {
            const segmentId = getSegmentId(dayIdx, timeIdx);
            
            if (newSelection.has(segmentId)) {
              newSelection.delete(segmentId);
            } else {
              newSelection.add(segmentId);
            }
          }
        }
        
        setSelectedSegments(newSelection);
        
        // Convert segments back to timeslots and notify parent
        const timeslotIds = convertSegmentsToTimeslotIds(newSelection);
        onSelectionChange(timeslotIds);
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
    <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
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
            {/* Grid cells with segments */}
            {TIME_SLOTS.map((time, timeIndex) => {
              const segmentId = getSegmentId(dayIndex, timeIndex);
              const isSelected = selectedSegments.has(segmentId);
              const isInSelection = isInSelectionArea(dayIndex, timeIndex);
              
              // Enhanced debugging for selection state
              if (dayIndex === 0 && timeIndex < 2) {
                console.log('🎯 Render segment:', {
                  segmentId,
                  isSelected,
                  selectedSegmentsSize: selectedSegments.size,
                  selectedSegmentsArray: Array.from(selectedSegments),
                  hasSegment: selectedSegments.has(segmentId)
                });
              }
              
              return (
                <TouchableOpacity
                  key={time} 
                  style={[
                    styles.gridCell, 
                    { height: SLOT_HEIGHT },
                    styles.hasTimeslot, // Always show as available
                    isSelected && styles.selectedCell,
                    isInSelection && styles.selectionPreview
                  ]}
                  onPress={() => handleSegmentClick(dayIndex, timeIndex)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.timeslotLabel, 
                    isSelected && styles.selectedLabel
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
      
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Rehearsal hours: 5:00 PM - 11:00 PM (No Friday rehearsals)
        </Text>
        <Text style={styles.instructionText}>
          Drag to select your available timeslots
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    margin: 8,
    maxHeight: 400, // Limit height to make it scrollable
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ef',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    height: 40,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    minHeight: 480, // 12 time slots × 40px height
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
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  instructionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
