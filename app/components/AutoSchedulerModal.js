import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { findBestRehearsalOpportunities } from '../utils/autoScheduler';

const AutoSchedulerModal = ({ visible, onSave, onCancel, actors, existingRehearsals }) => {
  const { scenes } = useApp();
  const [selectedDateRange, setSelectedDateRange] = useState('next7days');
  const [opportunities, setOpportunities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Date range options
  const dateRangeOptions = useMemo(() => [
    { id: 'next7days', label: 'Next 7 Days', days: 7 },
    { id: 'next14days', label: 'Next 2 Weeks', days: 14 },
    { id: 'next30days', label: 'Next Month', days: 30 }
  ], []);

  // Generate time slots for auto-scheduling (9 AM to 9 PM, 30-minute blocks)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Don't go past 9 PM
        if (hour === 20 && minute > 0) break;
        
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        const startTime12 = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const endTime12 = new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true
        });
        
        slots.push({
          id: `${startTime}-${endTime}`,
          startTime,
          endTime,
          label: `${startTime12} - ${endTime12}`
        });
      }
    }
    return slots;
  }, []);

  // Find best rehearsal opportunities for the selected date range
  const findBestOpportunities = useCallback(() => {
    if (!scenes || scenes.length === 0) {
      console.log('[AutoScheduler] No scenes available');
      setOpportunities([]);
      setSummary({
        totalActors: actors?.length || 0,
        availableActors: 0,
        scenes: scenes?.length || 0,
        dateRange: selectedDateRange,
        availableDates: 0
      });
      setSelectedOpportunity(null);
      return;
    }

    console.log('[AutoScheduler] Finding opportunities for:', selectedDateRange);

    const dateRangeConfig = dateRangeOptions.find(opt => opt.id === selectedDateRange);
    const days = dateRangeConfig?.days || 7;

    // Generate available dates (next N days, excluding weekends for now)
    const availableDates = [];
    const today = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (optional - could be configurable)
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
        availableDates.push(date);
      }
    }

    // Find opportunities for each date/time combination
    const allOpportunities = [];
    
    availableDates.forEach(date => {
      timeSlots.forEach(timeSlot => {
        scenes.forEach(scene => {
          // Check if this date/time conflicts with existing rehearsals
          const dateStr = date.toISOString().split('T')[0];
          const conflictingRehearsal = existingRehearsals?.find(r => 
            r.date === dateStr && 
            ((r.startTime <= timeSlot.startTime && r.endTime > timeSlot.startTime) ||
             (r.startTime < timeSlot.endTime && r.endTime >= timeSlot.endTime) ||
             (r.startTime >= timeSlot.startTime && r.endTime <= timeSlot.endTime))
          );

          if (!conflictingRehearsal) {
            // Count available actors for this scene
            const sceneActors = scene.actors || [];
            const availableActors = sceneActors.filter(actorId => {
              const actor = actors.find(a => a.id === actorId);
              if (!actor) return false;
              
              // Check if actor is available at this date/time
              if (actor.availability && Array.isArray(actor.availability)) {
                // Convert date and time slot to check against actor's availability
                const slotDate = date;
                const slotHour = parseInt(timeSlot.startTime.split(':')[0]);
                const slotMinute = parseInt(timeSlot.startTime.split(':')[1]);
                
                // Create a date object for this specific slot
                const slotDateTime = new Date(slotDate);
                slotDateTime.setHours(slotHour, slotMinute, 0, 0);
                
                // Check if any of the actor's availability slots match this time
                return actor.availability.some(availableSlot => {
                  try {
                    const availableDate = new Date(availableSlot);
                    // Check if it's the same date and within 30 minutes of the slot
                    const timeDiff = Math.abs(slotDateTime.getTime() - availableDate.getTime());
                    return timeDiff < 30 * 60 * 1000; // Within 30 minutes
                  } catch {
                    return false;
                  }
                });
              }
              
              return false; // Not available if no availability data
            });

            if (availableActors.length > 0) {
              allOpportunities.push({
                id: `${scene.id}-${dateStr}-${timeSlot.id}`,
                scene,
                date: dateStr,
                dateObj: date,
                timeSlot,
                availableActors,
                score: availableActors.length / sceneActors.length // Percentage of actors available
              });
            }
          }
        });
      });
    });

    // Sort by score (highest first) and limit results
    const bestOpportunities = allOpportunities
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Limit to top 20 opportunities

    console.log('[AutoScheduler] Found opportunities:', bestOpportunities.length);

    setOpportunities(bestOpportunities);
    setSummary({
      totalActors: actors?.length || 0,
      availableActors: actors?.length || 0, // Simplified for now
      scenes: scenes?.length || 0,
      dateRange: dateRangeConfig?.label || 'Next 7 Days',
      availableDates: availableDates.length,
      totalOpportunities: allOpportunities.length,
      bestOpportunities: bestOpportunities.length
    });
    setSelectedOpportunity(bestOpportunities[0] || null);
  }, [actors, existingRehearsals, scenes, selectedDateRange, dateRangeOptions, timeSlots]);

  // New improved method using the updated autoscheduler
  const findBestOpportunitiesImproved = useCallback(() => {
    if (!scenes || scenes.length === 0) {
      console.log('[AutoScheduler] No scenes available');
      setOpportunities([]);
      setSummary({
        totalActors: actors?.length || 0,
        availableActors: 0,
        scenes: scenes?.length || 0,
        dateRange: selectedDateRange,
        availableDates: 0
      });
      setSelectedOpportunity(null);
      return;
    }

    console.log('[AutoScheduler] Using improved scheduler logic');
    
    const dateRangeConfig = dateRangeOptions.find(opt => opt.id === selectedDateRange);
    const days = dateRangeConfig?.days || 7;

    // Get next few weekdays as potential rehearsal days
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const allOpportunities = [];

    weekdays.forEach(day => {
      try {
        const dayOpportunities = findBestRehearsalOpportunities(actors, day, existingRehearsals, [], scenes);
        dayOpportunities.forEach(opp => {
          // Convert to the format expected by the UI
          allOpportunities.push({
            id: `${opp.scene.id}-${opp.date}-${opp.timeslot.id}`,
            scene: opp.scene,
            date: opp.date,
            dateObj: opp.dateObj,
            timeSlot: opp.timeslot,
            availableActors: opp.actors.map(actor => actor.id),
            score: opp.efficiency,
            priority: opp.priority,
            efficiency: opp.efficiency
          });
        });
      } catch (error) {
        console.warn(`Failed to get opportunities for ${day}:`, error);
      }
    });

    // Sort by priority/score (highest first) and limit results
    const bestOpportunities = allOpportunities
      .sort((a, b) => (b.priority || b.score) - (a.priority || a.score))
      .slice(0, 20);

    console.log('[AutoScheduler] Found improved opportunities:', bestOpportunities.length);

    setOpportunities(bestOpportunities);
    setSummary({
      totalActors: actors?.length || 0,
      availableActors: actors?.filter(a => a.availability && a.availability.length > 0).length || 0,
      scenes: scenes?.length || 0,
      dateRange: dateRangeConfig?.label || 'Next 7 Days',
      availableDates: weekdays.length,
      totalOpportunities: allOpportunities.length,
      bestOpportunities: bestOpportunities.length
    });
    setSelectedOpportunity(bestOpportunities[0] || null);
  }, [actors, existingRehearsals, scenes, selectedDateRange, dateRangeOptions]);

  useEffect(() => {
    if (visible) {
      // Use the improved method
      findBestOpportunitiesImproved();
    }
  }, [visible, findBestOpportunitiesImproved]);

  const handleCreateRehearsal = () => {
    if (!selectedOpportunity) {
      Alert.alert('Error', 'Please select a rehearsal opportunity.');
      return;
    }

    // Create rehearsal from the selected opportunity
    const newRehearsal = {
      id: `rehearsal_${Date.now()}`,
      title: `${selectedOpportunity.scene.title} Rehearsal`,
      sceneId: selectedOpportunity.scene.id,
      date: selectedOpportunity.date,
      time: {
        start: selectedOpportunity.timeSlot.startTime,
        end: selectedOpportunity.timeSlot.endTime
      },
      actors: selectedOpportunity.availableActors.map(actorId => 
        actors.find(a => a.id === actorId)
      ).filter(Boolean),
      notes: `Auto-scheduled rehearsal with ${selectedOpportunity.availableActors.length} available actors (efficiency: ${Math.round((selectedOpportunity.efficiency || selectedOpportunity.score) * 100)}%)`
    };

    console.log('[AutoScheduler] Creating rehearsal:', newRehearsal);
    onSave(newRehearsal);
    resetModal();
  };

  const handleAutoScheduleRange = () => {
    const dateRangeConfig = dateRangeOptions.find(opt => opt.id === selectedDateRange);
    const rangeLabel = dateRangeConfig?.label || 'selected date range';
    
    Alert.alert(
      'Auto-Schedule Range',
      `This will automatically create multiple rehearsals for the ${rangeLabel}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create All',
          onPress: () => {
            // Take the top opportunities and create rehearsals for them
            const topOpportunities = opportunities.slice(0, 5); // Limit to top 5
            
            if (topOpportunities.length === 0) {
              Alert.alert('No Opportunities', 'No rehearsal opportunities found for this date range.');
              return;
            }
            
            const newRehearsals = topOpportunities.map(opp => ({
              id: `rehearsal_${Date.now()}_${Math.random()}`,
              title: `${opp.scene.title} Rehearsal`,
              sceneId: opp.scene.id,
              date: opp.date,
              time: {
                start: opp.timeSlot.startTime,
                end: opp.timeSlot.endTime
              },
              actors: opp.availableActors.map(actorId => 
                actors.find(a => a.id === actorId)
              ).filter(Boolean),
              notes: `Auto-scheduled rehearsal (efficiency: ${Math.round((opp.efficiency || opp.score) * 100)}%)`
            }));

            console.log('[AutoScheduler] Creating multiple rehearsals:', newRehearsals.length);

            // Save rehearsals one by one (assuming onSave handles single rehearsals)
            newRehearsals.forEach(rehearsal => onSave(rehearsal));
            
            Alert.alert(
              'Success',
              `Created ${newRehearsals.length} rehearsal${newRehearsals.length > 1 ? 's' : ''} for the ${rangeLabel}!`
            );
            resetModal();
          }
        }
      ]
    );
  };

  const resetModal = () => {
    setSelectedDateRange('next7days');
    setOpportunities([]);
    setSummary(null);
    setSelectedOpportunity(null);
  };

  const getPriorityColor = (priority) => {
    if (priority >= 70) return '#10b981'; // High priority - green
    if (priority >= 50) return '#f59e0b'; // Medium priority - yellow
    return '#ef4444'; // Low priority - red
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🤖 Auto Scheduler</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Date Range Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
              {dateRangeOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.dayButton, selectedDateRange === option.id && styles.selectedDayButton]}
                  onPress={() => setSelectedDateRange(option.id)}
                >
                  <Text style={[styles.dayButtonText, selectedDateRange === option.id && styles.selectedDayButtonText]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Summary */}
          {summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 {summary.dateRange} Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Available Dates:</Text>
                  <Text style={styles.summaryValue}>{summary.availableDates}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Opportunities:</Text>
                  <Text style={styles.summaryValue}>{summary.totalOpportunities}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Best Opportunities:</Text>
                  <Text style={styles.summaryValue}>{summary.bestOpportunities}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Scenes Available:</Text>
                  <Text style={styles.summaryValue}>{summary.scenes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Opportunities List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Best Opportunities</Text>
            {!scenes || scenes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No scenes available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Please create some scenes in the Scenes screen first.
                  {'\n\n'}The auto-scheduler needs scenes to find rehearsal opportunities.
                </Text>
              </View>
            ) : opportunities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No rehearsal opportunities found for the selected date range</Text>
                <Text style={styles.emptyStateSubtext}>
                  The auto-scheduler looks for:
                  {'\n'}• Available time slots for rehearsals
                  {'\n'}• Scenes that can be rehearsed
                  {'\n'}• Actors available for those scenes
                  {'\n\n'}Current data:
                  {'\n'}• Actors: {actors?.length || 0}
                  {'\n'}• Scenes: {scenes?.length || 0}
                  {'\n'}• Date Range: {summary?.dateRange || 'None selected'}
                  {'\n\n'}Try:
                  {'\n'}• Creating scenes and assigning actors to them
                  {'\n'}• Selecting a different date range
                  {'\n'}• Ensuring scenes have actors assigned
                </Text>
              </View>
            ) : (
              opportunities.slice(0, 8).map((opportunity, index) => (
                <TouchableOpacity
                  key={opportunity.id}
                  style={[
                    styles.opportunityCard,
                    selectedOpportunity === opportunity && styles.selectedOpportunityCard
                  ]}
                  onPress={() => setSelectedOpportunity(opportunity)}
                >
                  <View style={styles.opportunityHeader}>
                    <Text style={styles.opportunityTitle}>{opportunity.scene.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(opportunity.score * 100) }]}>
                      <Text style={styles.priorityText}>{Math.round(opportunity.score * 100)}%</Text>
                    </View>
                  </View>
                  
                  <View style={styles.opportunityDetails}>
                    <Text style={styles.opportunityTime}>
                      📅 {new Date(opportunity.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.opportunityTime}>
                      🕐 {opportunity.timeSlot.label}
                    </Text>
                  </View>
                  
                  <Text style={styles.opportunityActors}>
                    👥 {opportunity.availableActors.length} actor{opportunity.availableActors.length !== 1 ? 's' : ''} available
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {opportunities.length > 0 && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleCreateRehearsal}
                disabled={!selectedOpportunity}
              >
                <Text style={styles.actionButtonText}>
                  Create Selected Rehearsal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.autoButton]}
                onPress={handleAutoScheduleRange}
              >
                <Text style={styles.actionButtonText}>
                  🚀 Auto-Schedule Best Opportunities
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  daySelector: {
    flexDirection: 'row',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  selectedDayButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedDayButtonText: {
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  opportunityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedOpportunityCard: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  opportunityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  opportunityTime: {
    fontSize: 14,
    color: '#64748b',
  },
  opportunityActors: {
    fontSize: 14,
    color: '#64748b',
  },
  actions: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  autoButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButtonText: {
    color: '#64748b',
  },
});

export default AutoSchedulerModal;
