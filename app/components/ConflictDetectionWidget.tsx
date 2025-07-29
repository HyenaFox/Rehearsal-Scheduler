import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeWithTimezone, checkTimezoneOverlap } from '../utils/timezone';

interface ConflictDetectionWidgetProps {
  rehearsals?: any[];
  polls?: any[];
  onConflictResolved?: () => void;
}

interface Conflict {
  id: string;
  type: 'rehearsal-rehearsal' | 'rehearsal-calendar' | 'poll-rehearsal';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedActors: string[];
  events: any[];
  suggestions: string[];
}

export default function ConflictDetectionWidget({ 
  rehearsals = [], 
  polls = [], 
  onConflictResolved 
}: ConflictDetectionWidgetProps) {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (rehearsals.length > 0 || polls.length > 0) {
      detectConflicts();
    }
  }, [rehearsals, polls]);

  const detectConflicts = async () => {
    setLoading(true);
    try {
      // Get calendar events if user has Google Calendar connected
      let calendarData = [];
      try {
        const calendarStatus = await ApiService.getGoogleCalendarStatus();
        if (calendarStatus.connected) {
          const availableSlots = await ApiService.getAvailableSlots();
          calendarData = availableSlots.busyEvents || [];
        }
      } catch (error) {
        console.warn('Could not fetch calendar data:', error);
      }

      setCalendarEvents(calendarData);

      const detectedConflicts: Conflict[] = [];

      // Detect rehearsal-rehearsal conflicts
      for (let i = 0; i < rehearsals.length; i++) {
        for (let j = i + 1; j < rehearsals.length; j++) {
          const conflict = detectRehearsalConflict(rehearsals[i], rehearsals[j]);
          if (conflict) {
            detectedConflicts.push(conflict);
          }
        }
      }

      // Detect rehearsal-calendar conflicts
      for (const rehearsal of rehearsals) {
        for (const calendarEvent of calendarData) {
          const conflict = detectRehearsalCalendarConflict(rehearsal, calendarEvent);
          if (conflict) {
            detectedConflicts.push(conflict);
          }
        }
      }

      // Detect poll-rehearsal conflicts
      for (const poll of polls) {
        for (const rehearsal of rehearsals) {
          const conflict = detectPollRehearsalConflict(poll, rehearsal);
          if (conflict) {
            detectedConflicts.push(conflict);
          }
        }
      }

      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      Alert.alert('Error', 'Failed to detect conflicts');
    } finally {
      setLoading(false);
    }
  };

  const detectRehearsalConflict = (rehearsal1: any, rehearsal2: any): Conflict | null => {
    // Check if rehearsals overlap in time
    if (rehearsal1.date !== rehearsal2.date) {
      return null;
    }

    const start1 = parseTime(rehearsal1.time.start);
    const end1 = parseTime(rehearsal1.time.end);
    const start2 = parseTime(rehearsal2.time.start);
    const end2 = parseTime(rehearsal2.time.end);

    if (start1 >= end2 || start2 >= end1) {
      return null; // No overlap
    }

    // Check if same actors are involved
    const actors1 = new Set(rehearsal1.actorIds || []);
    const actors2 = new Set(rehearsal2.actorIds || []);
    const commonActors = [...actors1].filter(id => actors2.has(id));

    if (commonActors.length === 0) {
      return null; // No common actors
    }

    const actorNames = rehearsal1.actors
      ?.filter((actor: any) => commonActors.includes(actor.id))
      .map((actor: any) => actor.name) || [];

    return {
      id: `rehearsal-${rehearsal1._id}-${rehearsal2._id}`,
      type: 'rehearsal-rehearsal',
      severity: 'high',
      title: 'Rehearsal Schedule Conflict',
      description: `"${rehearsal1.title}" and "${rehearsal2.title}" overlap on ${rehearsal1.date}`,
      affectedActors: actorNames,
      events: [rehearsal1, rehearsal2],
      suggestions: [
        'Reschedule one of the rehearsals',
        'Split actors between rehearsals if possible',
        'Combine rehearsals if they share scenes'
      ]
    };
  };

  const detectRehearsalCalendarConflict = (rehearsal: any, calendarEvent: any): Conflict | null => {
    // Check if rehearsal conflicts with personal calendar
    const rehearsalStart = new Date(`${rehearsal.date}T${rehearsal.time.start}`);
    const rehearsalEnd = new Date(`${rehearsal.date}T${rehearsal.time.end}`);
    const eventStart = new Date(calendarEvent.start);
    const eventEnd = new Date(calendarEvent.end);

    if (rehearsalStart >= eventEnd || eventStart >= rehearsalEnd) {
      return null; // No overlap
    }

    return {
      id: `calendar-${rehearsal._id}-${calendarEvent.id}`,
      type: 'rehearsal-calendar',
      severity: 'medium',
      title: 'Personal Calendar Conflict',
      description: `Rehearsal "${rehearsal.title}" conflicts with "${calendarEvent.summary || 'Calendar Event'}"`,
      affectedActors: [user?.name || 'You'],
      events: [rehearsal, calendarEvent],
      suggestions: [
        'Reschedule the rehearsal',
        'Move or cancel the calendar event if possible',
        'Arrange for partial attendance if optional'
      ]
    };
  };

  const detectPollRehearsalConflict = (poll: any, rehearsal: any): Conflict | null => {
    // Check if poll time slots conflict with scheduled rehearsal
    if (!poll.timeSlots || poll.timeSlots.length === 0) {
      return null;
    }

    const conflictingSlots = poll.timeSlots.filter((slot: any) => {
      if (slot.date !== rehearsal.date) {
        return false;
      }

      const slotStart = parseTime(slot.startTime);
      const slotEnd = parseTime(slot.endTime);
      const rehearsalStart = parseTime(rehearsal.time.start);
      const rehearsalEnd = parseTime(rehearsal.time.end);

      return !(slotStart >= rehearsalEnd || rehearsalStart >= slotEnd);
    });

    if (conflictingSlots.length === 0) {
      return null;
    }

    // Check for common actors
    const pollActorIds = poll.targetActors?.map((target: any) => target.actorId) || [];
    const rehearsalActorIds = rehearsal.actorIds || [];
    const commonActors = pollActorIds.filter((id: string) => rehearsalActorIds.includes(id));

    if (commonActors.length === 0) {
      return null;
    }

    return {
      id: `poll-${poll._id}-${rehearsal._id}`,
      type: 'poll-rehearsal',
      severity: 'low',
      title: 'Poll Time Slot Conflict',
      description: `Poll "${poll.title}" has time slots that conflict with scheduled rehearsal "${rehearsal.title}"`,
      affectedActors: commonActors,
      events: [poll, rehearsal],
      suggestions: [
        'Remove conflicting time slots from poll',
        'Note the conflict in poll description',
        'Consider rescheduling the rehearsal'
      ]
    };
  };

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  const ConflictCard = ({ conflict }: { conflict: Conflict }) => (
    <View style={[styles.conflictCard, { borderLeftColor: getSeverityColor(conflict.severity) }]}>
      <View style={styles.conflictHeader}>
        <View style={styles.conflictTitleContainer}>
          <Text style={styles.conflictIcon}>{getSeverityIcon(conflict.severity)}</Text>
          <Text style={styles.conflictTitle}>{conflict.title}</Text>
        </View>
        <Text style={[styles.severityLabel, { color: getSeverityColor(conflict.severity) }]}>
          {conflict.severity.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.conflictDescription}>{conflict.description}</Text>

      {conflict.affectedActors.length > 0 && (
        <View style={styles.affectedActors}>
          <Text style={styles.affectedActorsLabel}>Affected:</Text>
          <Text style={styles.affectedActorsList}>
            {conflict.affectedActors.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.suggestions}>
        <Text style={styles.suggestionsLabel}>Suggestions:</Text>
        {conflict.suggestions.map((suggestion, index) => (
          <Text key={index} style={styles.suggestion}>
            • {suggestion}
          </Text>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>🔍 Detecting conflicts...</Text>
      </View>
    );
  }

  if (conflicts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noConflictsCard}>
          <Text style={styles.noConflictsIcon}>✅</Text>
          <Text style={styles.noConflictsTitle}>No Conflicts Detected</Text>
          <Text style={styles.noConflictsDescription}>
            Your current schedule looks good! No overlapping rehearsals or calendar conflicts found.
          </Text>
        </View>
      </View>
    );
  }

  const highPriorityConflicts = conflicts.filter(c => c.severity === 'high');
  const otherConflicts = conflicts.filter(c => c.severity !== 'high');

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.headerTitle}>
          ⚠️ {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
        </Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.conflictsList} showsVerticalScrollIndicator={false}>
          {/* High priority conflicts first */}
          {highPriorityConflicts.map(conflict => (
            <ConflictCard key={conflict.id} conflict={conflict} />
          ))}

          {/* Other conflicts */}
          {otherConflicts.map(conflict => (
            <ConflictCard key={conflict.id} conflict={conflict} />
          ))}

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={detectConflicts}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh Conflict Detection</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: '#64748b',
  },
  conflictsList: {
    maxHeight: 400,
  },
  conflictCard: {
    margin: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conflictIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  conflictDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  affectedActors: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  affectedActorsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  affectedActorsList: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  suggestions: {
    marginTop: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  suggestion: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
    marginLeft: 8,
  },
  noConflictsCard: {
    padding: 24,
    alignItems: 'center',
  },
  noConflictsIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  noConflictsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  noConflictsDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    margin: 12,
    padding: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});