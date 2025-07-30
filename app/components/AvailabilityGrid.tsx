import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { responsive, getScreenSize } from '../utils/responsive';

interface AvailabilityBlock {
  startTime: string;
  endTime: string;
  responseType: 'available' | 'if-needed';
}

interface DateRange {
  id: string;
  date: string;
  earliestTime: string;
  latestTime: string;
  description?: string;
}

interface AvailabilityGridProps {
  dateRange: DateRange;
  initialBlocks?: AvailabilityBlock[];
  onSelectionChange: (blocks: AvailabilityBlock[]) => void;
  readonly?: boolean;
  showOtherResponses?: AvailabilityBlock[][]; // Other actors' responses for overlay
  loading?: boolean;
  error?: string;
}

export default function AvailabilityGrid({ 
  dateRange, 
  initialBlocks = [], 
  onSelectionChange, 
  readonly = false,
  showOtherResponses = [],
  loading = false,
  error
}: AvailabilityGridProps) {
  const [selectedBlocks, setSelectedBlocks] = useState<AvailabilityBlock[]>(initialBlocks);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'available' | 'if-needed'>('available');
  const [dragStart, setDragStart] = useState<{ time: string; index: number } | null>(null);

  const screenSize = getScreenSize();
  const styles = createStyles(screenSize);

  // Generate time slots in 15-minute increments
  const generateTimeSlots = useCallback(() => {
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const toTimeString = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = toMinutes(dateRange.earliestTime);
    const endMinutes = toMinutes(dateRange.latestTime);
    const slots = [];

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
      const startTime = toTimeString(minutes);
      const endTime = toTimeString(minutes + 15);
      slots.push({ startTime, endTime });
    }

    return slots;
  }, [dateRange.earliestTime, dateRange.latestTime]);

  const timeSlots = generateTimeSlots();

  // Check if a time slot is selected
  const isSlotSelected = useCallback((slotStart: string, slotEnd: string) => {
    return selectedBlocks.find(block => 
      timeOverlaps(slotStart, slotEnd, block.startTime, block.endTime)
    );
  }, [selectedBlocks]);

  // Check if two time ranges overlap
  const timeOverlaps = (start1: string, end1: string, start2: string, end2: string) => {
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && e1 > s2;
  };

  // Get overlap count for visualization
  const getOverlapCount = useCallback((slotStart: string, slotEnd: string) => {
    let count = 0;
    showOtherResponses.forEach(actorBlocks => {
      const hasOverlap = actorBlocks.some(block => 
        timeOverlaps(slotStart, slotEnd, block.startTime, block.endTime)
      );
      if (hasOverlap) count++;
    });
    return count;
  }, [showOtherResponses]);

  // Handle slot press/drag start
  const handleSlotPress = useCallback((slotIndex: number, slot: { startTime: string; endTime: string }) => {
    if (readonly) return;

    const existingBlock = isSlotSelected(slot.startTime, slot.endTime);
    
    if (existingBlock) {
      // Remove existing selection
      const newBlocks = selectedBlocks.filter(block => 
        !timeOverlaps(slot.startTime, slot.endTime, block.startTime, block.endTime)
      );
      setSelectedBlocks(newBlocks);
      onSelectionChange(newBlocks);
    } else {
      // Start new selection
      setIsSelecting(true);
      setDragStart({ time: slot.startTime, index: slotIndex });
      
      const newBlock: AvailabilityBlock = {
        startTime: slot.startTime,
        endTime: slot.endTime,
        responseType: selectionMode
      };
      
      const newBlocks = [...selectedBlocks, newBlock];
      setSelectedBlocks(newBlocks);
      onSelectionChange(newBlocks);
    }
  }, [selectedBlocks, selectionMode, readonly, onSelectionChange, isSlotSelected]);

  // Handle drag over slot
  const handleSlotDragOver = useCallback((slotIndex: number, slot: { startTime: string; endTime: string }) => {
    if (!isSelecting || !dragStart || readonly) return;

    const startIndex = Math.min(dragStart.index, slotIndex);
    const endIndex = Math.max(dragStart.index, slotIndex);

    // Remove previous selection for this drag
    const otherBlocks = selectedBlocks.filter(block => {
      const blockStart = timeSlots.findIndex(s => s.startTime === block.startTime);
      return blockStart < dragStart.index || blockStart > slotIndex;
    });

    // Create new selection range
    const newBlocks = [...otherBlocks];
    for (let i = startIndex; i <= endIndex; i++) {
      const timeSlot = timeSlots[i];
      if (timeSlot) {
        newBlocks.push({
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          responseType: selectionMode
        });
      }
    }

    // Merge adjacent blocks
    const mergedBlocks = mergeAdjacentBlocks(newBlocks);
    setSelectedBlocks(mergedBlocks);
    onSelectionChange(mergedBlocks);
  }, [isSelecting, dragStart, selectedBlocks, selectionMode, timeSlots, readonly, onSelectionChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsSelecting(false);
    setDragStart(null);
  }, []);

  // Merge adjacent blocks of the same type
  const mergeAdjacentBlocks = (blocks: AvailabilityBlock[]): AvailabilityBlock[] => {
    if (blocks.length === 0) return blocks;

    const sorted = blocks.sort((a, b) => {
      const toMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      return toMinutes(a.startTime) - toMinutes(b.startTime);
    });

    const merged: AvailabilityBlock[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (last.endTime === current.startTime && last.responseType === current.responseType) {
        // Merge adjacent blocks
        last.endTime = current.endTime;
      } else {
        merged.push(current);
      }
    }

    return merged;
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours >= 12 ? 'PM' : 'AM';
    return minutes === 0 ? `${displayHour}${period}` : `${displayHour}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load availability grid</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingIcon}>⏳</Text>
          </View>
          <Text style={styles.loadingText}>Loading availability grid...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.dateSection}>
            <Text style={styles.dateTitle}>
              {new Date(dateRange.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
            <View style={styles.timeRangeContainer}>
              <Text style={styles.timeRangeIcon}>🕐</Text>
              <Text style={styles.timeRange}>
                {formatTime(dateRange.earliestTime)} - {formatTime(dateRange.latestTime)}
              </Text>
            </View>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, selectedBlocks.length > 0 && styles.statusDotActive]}></View>
            <Text style={styles.statusText}>
              {selectedBlocks.length > 0 ? `${selectedBlocks.length} block${selectedBlocks.length > 1 ? 's' : ''}` : 'No selection'}
            </Text>
          </View>
        </View>
        {dateRange.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionIcon}>💭</Text>
            <Text style={styles.description}>{dateRange.description}</Text>
          </View>
        )}
      </View>

      {/* Selection Mode Toggle */}
      {!readonly && (
        <View style={styles.modeToggle}>
          <Text style={styles.modeToggleTitle}>Selection Mode</Text>
          <View style={styles.modeButtons}>
            <Pressable 
              style={[styles.modeButton, selectionMode === 'available' && styles.modeButtonActive]}
              onPress={() => setSelectionMode('available')}
              android_ripple={{ color: '#10b981', borderless: false }}
            >
              <View style={styles.modeButtonContent}>
                <Text style={styles.modeButtonIcon}>✅</Text>
                <Text style={[styles.modeButtonText, selectionMode === 'available' && styles.modeButtonTextActive]}>
                  Available
                </Text>
              </View>
              {selectionMode === 'available' && <View style={styles.modeButtonActiveIndicator} />}
            </Pressable>
            <Pressable 
              style={[styles.modeButton, selectionMode === 'if-needed' && styles.modeButtonActive]}
              onPress={() => setSelectionMode('if-needed')}
              android_ripple={{ color: '#f59e0b', borderless: false }}
            >
              <View style={styles.modeButtonContent}>
                <Text style={styles.modeButtonIcon}>🟡</Text>
                <Text style={[styles.modeButtonText, selectionMode === 'if-needed' && styles.modeButtonTextActive]}>
                  If Needed
                </Text>
              </View>
              {selectionMode === 'if-needed' && <View style={styles.modeButtonActiveIndicator} />}
            </Pressable>
          </View>
        </View>
      )}

      {/* Time Grid */}
      <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {timeSlots.map((slot, index) => {
            const selectedBlock = isSlotSelected(slot.startTime, slot.endTime);
            const overlapCount = getOverlapCount(slot.startTime, slot.endTime);
            const isHourMark = slot.startTime.endsWith(':00');

            return (
              <View key={`${slot.startTime}-${slot.endTime}`} style={styles.slotRow}>
                {/* Time Label */}
                {isHourMark && (
                  <View style={styles.timeLabel}>
                    <Text style={styles.timeLabelText}>{formatTime(slot.startTime)}</Text>
                  </View>
                )}
                
                {/* Time Slot */}
                <Pressable
                  style={[
                    styles.timeSlot,
                    selectedBlock && selectedBlock.responseType === 'available' && styles.slotAvailable,
                    selectedBlock && selectedBlock.responseType === 'if-needed' && styles.slotIfNeeded,
                    overlapCount > 0 && styles.slotWithOverlap,
                    isHourMark && styles.slotHourMark,
                    isSelecting && styles.slotSelecting
                  ]}
                  onPress={() => handleSlotPress(index, slot)}
                  onPressIn={() => handleSlotPress(index, slot)}
                  onHoverIn={() => handleSlotDragOver(index, slot)}
                  onPressOut={handleDragEnd}
                  android_ripple={{ 
                    color: selectionMode === 'available' ? '#10b981' : '#f59e0b', 
                    borderless: false 
                  }}
                >
                  {/* Overlap indicator */}
                  {overlapCount > 0 && (
                    <View style={styles.overlapIndicator}>
                      <Text style={styles.overlapCount}>{overlapCount}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Selection Summary */}
      {selectedBlocks.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>📋 Your Availability</Text>
            <View style={styles.summaryStats}>
              <Text style={styles.summaryStatsText}>{selectedBlocks.length} block{selectedBlocks.length > 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={styles.summaryBlocks}>
            {selectedBlocks.map((block, index) => (
              <View key={index} style={[styles.summaryBlock, 
                block.responseType === 'available' ? styles.summaryBlockAvailable : styles.summaryBlockIfNeeded
              ]}>
                <Text style={styles.summaryBlockIcon}>
                  {block.responseType === 'available' ? '✅' : '🟡'}
                </Text>
                <Text style={styles.summaryBlockTime}>
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </Text>
                <Text style={styles.summaryBlockType}>
                  {block.responseType === 'available' ? 'Available' : 'If Needed'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (screenSize: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    padding: responsive.spacing.md,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateSection: {
    flex: 1,
  },
  dateTitle: {
    fontSize: responsive.fontSize.lg,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: responsive.spacing.xs,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.xs,
  },
  timeRangeIcon: {
    fontSize: responsive.fontSize.sm,
  },
  timeRange: {
    fontSize: responsive.fontSize.md,
    color: '#64748b',
  },
  statusIndicator: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginBottom: 4,
  },
  statusDotActive: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: responsive.fontSize.xs,
    color: '#64748b',
    fontWeight: '500',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.xs,
    marginTop: responsive.spacing.sm,
    paddingTop: responsive.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  descriptionIcon: {
    fontSize: responsive.fontSize.sm,
  },
  description: {
    fontSize: responsive.fontSize.sm,
    color: '#64748b',
    fontStyle: 'italic',
    flex: 1,
  },
  modeToggle: {
    padding: responsive.spacing.md,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modeToggleTitle: {
    fontSize: responsive.fontSize.sm,
    fontWeight: '600',
    color: '#374151',
    marginBottom: responsive.spacing.sm,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: responsive.spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: responsive.spacing.md,
    paddingHorizontal: responsive.spacing.md,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.xs,
  },
  modeButtonIcon: {
    fontSize: responsive.fontSize.md,
  },
  modeButtonText: {
    fontSize: responsive.fontSize.sm,
    color: '#64748b',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modeButtonActiveIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: responsive.spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  timeLabel: {
    position: 'absolute',
    left: screenSize.isPhone ? -responsive.spacing.sm : -responsive.spacing.xs,
    zIndex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: responsive.spacing.xs,
    borderRadius: 4,
  },
  timeLabelText: {
    fontSize: screenSize.isPhone ? responsive.fontSize.sm : responsive.fontSize.xs,
    color: '#64748b',
    fontWeight: '600',
    fontVariant: screenSize.isPhone ? ['tabular-nums'] : undefined,
  },
  timeSlot: {
    flex: 1,
    height: screenSize.isPhone ? 32 : 24,
    marginLeft: screenSize.isPhone ? 50 : 60,
    borderWidth: 0.5,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    position: 'relative',
    borderRadius: 2,
    minTouchTargetSize: screenSize.isPhone ? 44 : undefined,
  },
  slotHourMark: {
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    height: 26,
  },
  slotAvailable: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  slotIfNeeded: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  slotWithOverlap: {
    borderColor: '#6366f1',
    borderWidth: 1,
  },
  slotSelecting: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  overlapIndicator: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlapCount: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  summary: {
    padding: responsive.spacing.md,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
  },
  summaryTitle: {
    fontSize: responsive.fontSize.md,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryStats: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: responsive.spacing.sm,
    paddingVertical: 4,
  },
  summaryStatsText: {
    fontSize: responsive.fontSize.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  summaryBlocks: {
    gap: responsive.spacing.sm,
  },
  summaryBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    gap: responsive.spacing.sm,
  },
  summaryBlockAvailable: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  summaryBlockIfNeeded: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  summaryBlockIcon: {
    fontSize: responsive.fontSize.md,
  },
  summaryBlockTime: {
    fontSize: responsive.fontSize.sm,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  summaryBlockType: {
    fontSize: responsive.fontSize.xs,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.spacing.xl,
  },
  errorIcon: {
    fontSize: responsive.fontSize.xxl,
    marginBottom: responsive.spacing.md,
  },
  errorTitle: {
    fontSize: responsive.fontSize.lg,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: responsive.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: responsive.fontSize.md,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.spacing.xl,
  },
  loadingSpinner: {
    marginBottom: responsive.spacing.md,
  },
  loadingIcon: {
    fontSize: responsive.fontSize.xxl,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: responsive.fontSize.md,
    color: '#64748b',
    textAlign: 'center',
  },
});