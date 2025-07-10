// Test to verify the calendar scrolling functionality
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const TIME_SLOTS = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Sat'];

const ScrollTestComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar Scroll Test</Text>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.timeHeader}><Text>Time</Text></View>
        {DAYS.map(day => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        <View style={styles.grid}>
          {/* Time Column */}
          <View style={styles.timeColumn}>
            {TIME_SLOTS.map(time => (
              <View key={time} style={styles.timeSlot}>
                <Text style={styles.timeText}>{time}</Text>
              </View>
            ))}
          </View>
          
          {/* Day Columns */}
          {DAYS.map(day => (
            <View key={day} style={styles.dayColumn}>
              {TIME_SLOTS.map(time => (
                <View key={time} style={styles.gridCell}>
                  <Text style={styles.cellText}>{time.slice(0, 4)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ef',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    height: 40,
  },
  timeHeader: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  grid: {
    flexDirection: 'row',
    minHeight: TIME_SLOTS.length * 40,
  },
  timeColumn: {
    width: 60,
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeSlot: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
  },
  dayColumn: {
    flex: 1,
  },
  gridCell: {
    height: 40,
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

export default ScrollTestComponent;
