import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import ApiService from '../services/api';

interface WeeklyAvailability {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilityCalendarProps {
  onTimeSlotPress: (datetime: string) => void;
  selectedSlots: string[];
}

const generateTimeSlots = (date: string, weeklyAvailabilities: WeeklyAvailability[]): Date[] => {
  const slots: Date[] = [];
  const dayOfWeek = new Date(date).getDay();
  const availabilityForDay = weeklyAvailabilities.filter(a => a.dayOfWeek === dayOfWeek);

  availabilityForDay.forEach(avail => {
    const [startHour] = avail.startTime.split(':').map(Number);
    const [endHour] = avail.endTime.split(':').map(Number);

    for (let i = 0; i < 48; i++) {
      const hour = Math.floor(i / 2);
      const minute = (i % 2) * 30;

      if (hour >= startHour && hour < endHour) {
        const time = new Date(date);
        time.setHours(hour, minute);
        slots.push(time);
      }
    }
  });

  return slots;
};

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ onTimeSlotPress, selectedSlots }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyAvailabilities, setWeeklyAvailabilities] = useState<WeeklyAvailability[]>([]);
  const [timeSlots, setTimeSlots] = useState<Date[]>([]);

  useEffect(() => {
    fetchWeeklyAvailabilities();
  }, []);

  useEffect(() => {
    setTimeSlots(generateTimeSlots(selectedDate, weeklyAvailabilities));
  }, [selectedDate, weeklyAvailabilities]);

  const fetchWeeklyAvailabilities = async () => {
    try {
      const data = await ApiService.getWeeklyAvailabilities();
      setWeeklyAvailabilities(data);
    } catch (error) {
      console.error('Error fetching weekly availabilities:', error);
    }
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#10b981' },
        }}
        theme={{
          selectedDayBackgroundColor: '#10b981',
          todayTextColor: '#10b981',
          arrowColor: '#10b981',
        }}
      />
      <ScrollView style={styles.timeSlotContainer}>
        {timeSlots.length > 0 ? (
          timeSlots.map((slot, index) => {
            const slotString = slot.toISOString();
            const isSelected = selectedSlots.includes(slotString);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
                onPress={() => onTimeSlotPress(slotString)}
              >
                <Text style={isSelected ? styles.selectedTimeText : styles.timeText}>
                  {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noSlotsText}>No available slots for this day.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
  },
  timeSlotContainer: {
    flex: 1,
    paddingLeft: 10,
  },
  timeSlot: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTimeSlot: {
    backgroundColor: '#10b981',
  },
  timeText: {
    color: '#000',
  },
  selectedTimeText: {
    color: '#fff',
  },
  noSlotsText: {
    padding: 10,
    textAlign: 'center',
    color: '#999',
  },
});

export default AvailabilityCalendar;
