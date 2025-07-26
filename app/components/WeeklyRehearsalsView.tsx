import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WeeklyRehearsalsCalendar from './WeeklyRehearsalsCalendar';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface WeeklyRehearsalsViewProps {
  rehearsals: any[];
}

interface SelectedSlotInfo {
  day: string;
  time: string;
  rehearsal: any | null;
}

const WeeklyRehearsalsView: React.FC<WeeklyRehearsalsViewProps> = ({ rehearsals }) => {
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<SelectedSlotInfo | null>(null);

  // Filter rehearsals to only include valid rehearsal days (Sunday-Thursday, days 0-4)
  const validRehearsals = rehearsals.filter(rehearsal => {
    if (!rehearsal.date) return false;
    
    const date = new Date(rehearsal.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    
    // Only include Sunday (0) through Thursday (4)
    return dayOfWeek >= 0 && dayOfWeek <= 4;
  });


  const handleTimeSlotSelect = (day: number, hour: number, minute: number, rehearsal: any | null) => {
    const dayName = dayNames[day];
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    
    
    setSelectedSlotInfo({
      day: dayName,
      time: timeString,
      rehearsal
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Weekly Schedule</Text>
        {validRehearsals.length > 0 && (
          <Text style={styles.weekInfo}>
            {validRehearsals.length} rehearsal{validRehearsals.length > 1 ? 's' : ''} this week
          </Text>
        )}
      </View>
      
      <View style={styles.calendarSection}>
        <WeeklyRehearsalsCalendar 
          rehearsals={validRehearsals}
          onTimeSlotSelect={handleTimeSlotSelect}
        />
      </View>
      
      {selectedSlotInfo && (
        <View style={styles.selectedSlotDetails}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>
              {selectedSlotInfo.day} at {selectedSlotInfo.time}
            </Text>
          </View>
          
          {selectedSlotInfo.rehearsal ? (
            <View style={styles.rehearsalDetails}>
              <Text style={styles.rehearsalTitle}>{selectedSlotInfo.rehearsal.title}</Text>
              {selectedSlotInfo.rehearsal.scene && (
                <Text style={styles.rehearsalScene}>🎬 Scene: {selectedSlotInfo.rehearsal.scene}</Text>
              )}
              <Text style={styles.rehearsalTime}>
                ⏰ {selectedSlotInfo.rehearsal.time?.start || selectedSlotInfo.rehearsal.timeslot?.startTime || '6:00 PM'} - {selectedSlotInfo.rehearsal.time?.end || selectedSlotInfo.rehearsal.timeslot?.endTime || '8:00 PM'}
              </Text>
              <View style={styles.actorsSection}>
                <Text style={styles.actorsTitle}>
                  👥 Actors ({selectedSlotInfo.rehearsal.actors.length}):
                </Text>
                <View style={styles.actorsList}>
                  {selectedSlotInfo.rehearsal.actors.map((actor: any, index: number) => (
                    <View key={actor.id || index} style={styles.actorChip}>
                      <Text style={styles.actorName}>{actor.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {selectedSlotInfo.rehearsal.notes && (
                <Text style={styles.rehearsalNotes}>📝 {selectedSlotInfo.rehearsal.notes}</Text>
              )}
            </View>
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>No rehearsal scheduled</Text>
              <Text style={styles.emptySlotSubtext}>This time slot is available for scheduling</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#e0f2fe' }]} />
            <Text style={styles.legendText}>Rehearsal Scheduled</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  weekInfo: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  calendarSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
    flex: 1,
  },
  selectedSlotDetails: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
  },
  detailsHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  rehearsalDetails: {
    gap: 12,
  },
  rehearsalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  rehearsalScene: {
    fontSize: 16,
    color: '#7c3aed',
    fontWeight: '500',
  },
  rehearsalTime: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  actorsSection: {
    gap: 8,
  },
  actorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actorChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actorName: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  rehearsalNotes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  emptySlot: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptySlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySlotSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  legend: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default WeeklyRehearsalsView;