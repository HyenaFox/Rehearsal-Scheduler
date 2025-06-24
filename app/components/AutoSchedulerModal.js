import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GLOBAL_TIMESLOTS } from '../types/index';
import {
    autoScheduleDay,
    createRehearsalFromOpportunity,
    findBestRehearsalOpportunities,
    getSchedulingSummary
} from '../utils/autoScheduler';

const AutoSchedulerModal = ({ visible, onSave, onCancel, actors, existingRehearsals }) => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [opportunities, setOpportunities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Get unique days from timeslots
  const availableDays = [...new Set(GLOBAL_TIMESLOTS.map(ts => ts.day))];
  const updateOpportunities = useCallback(() => {
    const opps = findBestRehearsalOpportunities(actors, selectedDay, existingRehearsals);
    const summaryData = getSchedulingSummary(actors, selectedDay, existingRehearsals);
    setOpportunities(opps);
    setSummary(summaryData);
    setSelectedOpportunity(opps[0] || null);
  }, [actors, selectedDay, existingRehearsals]);

  useEffect(() => {
    if (visible && selectedDay) {
      updateOpportunities();
    }
  }, [visible, selectedDay, updateOpportunities]);

  const handleCreateRehearsal = () => {
    if (!selectedOpportunity) {
      Alert.alert('Error', 'Please select a rehearsal opportunity.');
      return;
    }

    const newRehearsal = createRehearsalFromOpportunity(selectedOpportunity);
    onSave(newRehearsal);
    resetModal();
  };
  const handleAutoScheduleDay = () => {
    Alert.alert(
      'Auto-Schedule Day',
      `This will automatically create multiple rehearsals for ${selectedDay}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create All',
          onPress: () => {
            const newRehearsals = autoScheduleDay(actors, selectedDay, existingRehearsals, 5);
            if (newRehearsals.length === 0) {
              Alert.alert('No Opportunities', 'No rehearsal opportunities found for this day.');
              return;
            }
            
            // Save all rehearsals at once
            onSave(newRehearsals, true); // Pass flag to indicate multiple rehearsals
            Alert.alert(
              'Success', 
              `Created ${newRehearsals.length} rehearsal${newRehearsals.length > 1 ? 's' : ''} for ${selectedDay}!`
            );
            resetModal();
          }
        }
      ]
    );
  };

  const resetModal = () => {
    setSelectedDay('Monday');
    setOpportunities([]);
    setSummary(null);
    setSelectedOpportunity(null);
  };

  const getPriorityColor = (priority) => {
    if (priority >= 70) return '#10b981'; // High priority - green
    if (priority >= 50) return '#f59e0b'; // Medium priority - yellow
    return '#ef4444'; // Low priority - red
  };

  const getEfficiencyText = (efficiency) => {
    if (efficiency === 1) return 'Perfect';
    if (efficiency >= 0.8) return 'Excellent';
    if (efficiency >= 0.6) return 'Good';
    if (efficiency >= 0.4) return 'Fair';
    return 'Limited';
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
          {/* Day Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
              {availableDays.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, selectedDay === day && styles.selectedDayButton]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayButtonText, selectedDay === day && styles.selectedDayButtonText]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Summary */}
          {summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 {selectedDay} Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Available Timeslots:</Text>
                  <Text style={styles.summaryValue}>{summary.availableTimeslots} of {summary.totalTimeslots}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Rehearsal Opportunities:</Text>
                  <Text style={styles.summaryValue}>{summary.totalOpportunities}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Best Priority Score:</Text>
                  <Text style={[styles.summaryValue, { color: summary.bestOpportunity ? getPriorityColor(summary.bestOpportunity.priority) : '#666' }]}>
                    {summary.bestOpportunity ? summary.bestOpportunity.priority : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Opportunities List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Best Opportunities</Text>            {opportunities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No rehearsal opportunities found for {selectedDay}</Text>
                <Text style={styles.emptyStateSubtext}>
                  The auto-scheduler looks for:
                  {'\n'}• Available actors for timeslots
                  {'\n'}• Scenes that can be rehearsed together
                  {'\n'}• Optimal scheduling efficiency
                  {'\n\n'}Try selecting a different day or check actor availability and scene assignments.
                </Text>
              </View>
            ) : (
              opportunities.slice(0, 5).map((opportunity, index) => (
                <TouchableOpacity
                  key={`${opportunity.timeslot.id}-${opportunity.scene.id}`}
                  style={[
                    styles.opportunityCard,
                    selectedOpportunity === opportunity && styles.selectedOpportunityCard
                  ]}
                  onPress={() => setSelectedOpportunity(opportunity)}
                >
                  <View style={styles.opportunityHeader}>
                    <Text style={styles.opportunityTitle}>{opportunity.scene.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(opportunity.priority) }]}>
                      <Text style={styles.priorityText}>{opportunity.priority}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.opportunityTimeslot}>
                    ⏰ {opportunity.timeslot.label}
                  </Text>
                  
                  <Text style={styles.opportunityActors}>
                    👥 {opportunity.actors.map(a => a.name).join(', ')} ({opportunity.actors.length} actor{opportunity.actors.length > 1 ? 's' : ''})
                  </Text>
                  
                  <View style={styles.opportunityMetrics}>
                    <Text style={styles.metricText}>
                      Efficiency: {getEfficiencyText(opportunity.efficiency)} ({Math.round(opportunity.efficiency * 100)}%)
                    </Text>
                  </View>
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
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreateRehearsal}
                disabled={!selectedOpportunity}
              >
                <Text style={styles.actionButtonText}>
                  Create Selected Rehearsal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.autoButton]}
                onPress={handleAutoScheduleDay}
              >
                <Text style={styles.actionButtonText}>
                  🚀 Auto-Schedule Entire Day
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
    backgroundColor: '#6366f1',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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
    color: '#1e293b',
    marginBottom: 12,
  },
  daySelector: {
    flexDirection: 'row',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  selectedDayButton: {
    backgroundColor: '#6366f1',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  opportunityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOpportunityCard: {
    borderColor: '#6366f1',
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
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  opportunityTimeslot: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  opportunityActors: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  opportunityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  actions: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#10b981',
  },
  autoButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: 'transparent',
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
