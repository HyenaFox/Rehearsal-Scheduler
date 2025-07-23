import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WeeklyAvailabilityCalendar from '../components/WeeklyAvailabilityCalendar';
import { useApp } from '../contexts/AppContext';
import { commonStyles } from '../styles/common';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklyAvailabilityScreen = () => {
  const { actors } = useApp();
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);

  // Debug logging
  React.useEffect(() => {
    console.log('📊 WeeklyAvailabilityScreen - actors:', actors.length);
    console.log('📊 Actors data:', actors.slice(0, 2)); // Show first 2 actors
  }, [actors]);

  const handleTimeSlotSelect = (day, hour, minute, availableActors) => {
    const dayName = daysOfWeek[day];
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    
    console.log(`🎭 Selected slot: ${dayName} ${timeString} with ${availableActors.length} actors`);
    
    setSelectedSlotInfo({
      day: dayName,
      time: timeString,
      actors: availableActors
    });
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Availability</Text>
        <Text style={styles.subtitle}>
          View actor availability for rehearsal times. Tap on a time slot to see who&apos;s available.
        </Text>
      </View>
      
      <View style={styles.calendarSection}>
        <WeeklyAvailabilityCalendar 
          actors={actors}
          onTimeSlotSelect={handleTimeSlotSelect}
        />
      </View>
      
      {selectedSlotInfo && (
        <View style={styles.selectedSlotDetails}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>
              {selectedSlotInfo.day} at {selectedSlotInfo.time}
            </Text>
            <Text style={styles.actorCount}>
              {selectedSlotInfo.actors.length} {selectedSlotInfo.actors.length === 1 ? 'actor' : 'actors'}
            </Text>
          </View>
          
          {selectedSlotInfo.actors.length > 0 ? (
            <View style={styles.actorsList}>
              {selectedSlotInfo.actors.map(actor => (
                <View key={actor.id} style={styles.actorChip}>
                  <Text style={styles.actorName}>{actor.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noActorsText}>No actors available for this time slot</Text>
          )}
        </View>
      )}
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' }]} />
            <Text style={styles.legendText}>No actors</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#e0f2fe' }]} />
            <Text style={styles.legendText}>Some actors</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#7dd3fc' }]} />
            <Text style={styles.legendText}>Many actors</Text>
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
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  actorCount: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  actorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actorChip: {
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  actorName: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  noActorsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  legend: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    color: '#64748b',
  },
});

export default WeeklyAvailabilityScreen;
