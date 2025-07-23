import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const RehearsalsDisplay = ({ rehearsals, onDeleteRehearsal, isAdmin = false }) => {
  // Helper function to format date and time for display
  const formatRehearsalTime = (rehearsal) => {
    // Debug: Log the rehearsal structure
    console.log('📋 Rehearsal data structure:', JSON.stringify(rehearsal, null, 2));
    
    // Handle old format with timeslot
    if (rehearsal.timeslot && rehearsal.timeslot.day && rehearsal.timeslot.startTime && rehearsal.timeslot.endTime) {
      // Format times to 12-hour format
      const formatTime = (time24) => {
        try {
          const date = new Date(`2000-01-01T${time24}`);
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } catch {
          return time24; // fallback to original if parsing fails
        }
      };
      
      const startTime12 = formatTime(rehearsal.timeslot.startTime);
      const endTime12 = formatTime(rehearsal.timeslot.endTime);
      return `${rehearsal.timeslot.day} - ${startTime12} to ${endTime12}`;
    }
    
    // Handle new format with date and time
    if (rehearsal.date && rehearsal.time && rehearsal.time.start && rehearsal.time.end) {
      try {
        // Parse the date (format: "2025-07-23")
        const date = new Date(rehearsal.date + 'T00:00:00');
        if (isNaN(date.getTime())) {
          console.error('❌ Invalid date format:', rehearsal.date);
          return `${rehearsal.date} - ${rehearsal.time.start} to ${rehearsal.time.end}`;
        }
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayName = dayNames[date.getDay()];
        const monthName = monthNames[date.getMonth()];
        const dayNum = date.getDate();
        
        const formattedDate = `${dayName}, ${monthName} ${dayNum}`;
        
        // Format times to 12-hour format
        const formatTime = (time24) => {
          try {
            const date = new Date(`2000-01-01T${time24}`);
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          } catch {
            return time24; // fallback to original if parsing fails
          }
        };
        
        const startTime12 = formatTime(rehearsal.time.start);
        const endTime12 = formatTime(rehearsal.time.end);
        const timeRange = `${startTime12} to ${endTime12}`;
        
        return `${formattedDate} - ${timeRange}`;
      } catch (error) {
        console.error('❌ Error formatting date:', error);
        // Format times to 12-hour format even in error case
        const formatTime = (time24) => {
          try {
            const date = new Date(`2000-01-01T${time24}`);
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          } catch {
            return time24; // fallback to original if parsing fails
          }
        };
        const startTime12 = formatTime(rehearsal.time.start);
        const endTime12 = formatTime(rehearsal.time.end);
        return `${rehearsal.date} - ${startTime12} to ${endTime12}`;
      }
    }
    
    // Try to handle database timestamps (createdDate, etc.)
    if (rehearsal.createdDate) {
      try {
        const date = new Date(rehearsal.createdDate);
        const formatted = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        return `${formatted} - Time TBD`;
      } catch (error) {
        console.error('❌ Error formatting createdDate:', error);
      }
    }
    
    // Fallback for any other format
    console.warn('⚠️ Unknown rehearsal format, using fallback');
    return 'Time TBD';
  };

  if (rehearsals.length === 0) {
    return (
      <View style={commonStyles.emptyState}>
        <Text style={commonStyles.emptyStateText}>
          No shows scheduled yet.{isAdmin ? ' Tap "Add Show" to get started!' : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.rehearsalsContainer}>
      <Text style={styles.rehearsalsTitle}>📅 Scheduled Shows ({rehearsals.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rehearsalsScroll}>
        {rehearsals.map((rehearsal, index) => (
          <View key={index} style={styles.rehearsalCard}>
            <View style={styles.rehearsalHeader}>
              <Text style={styles.rehearsalTitle}>{rehearsal.title}</Text>
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.deleteRehearsalButton}
                  onPress={() => onDeleteRehearsal(index)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteRehearsalText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.rehearsalDetails}>
              <Text style={styles.rehearsalTime}>
                ⏰ {formatRehearsalTime(rehearsal)}
              </Text>
              {rehearsal.scene && (
                <Text style={styles.rehearsalScene}>
                  🎬 {typeof rehearsal.scene === 'string' ? rehearsal.scene : (rehearsal.scene?.title || rehearsal.scene?.name || 'Scene TBD')}
                </Text>
              )}
              <Text style={styles.rehearsalActors}>
                🎭 {rehearsal.actors.map(actor => actor.name).join(', ')}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = {
  rehearsalsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rehearsalsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  rehearsalsScroll: {
    flexGrow: 0,
  },
  rehearsalCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    minWidth: 240,
    maxWidth: 300,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  rehearsalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rehearsalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    letterSpacing: 0.3,
  },
  deleteRehearsalButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteRehearsalText: {
    fontSize: 16,
  },
  rehearsalDetails: {
    gap: 8,
  },
  rehearsalTime: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rehearsalScene: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  rehearsalActors: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 20,
  },
};

export default RehearsalsDisplay;
