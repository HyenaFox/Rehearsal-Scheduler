import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const RehearsalsDisplay = ({ rehearsals, onDeleteRehearsal, isAdmin = false }) => {
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
              <Text style={styles.rehearsalTime}>⏰ {rehearsal.timeslot.label}</Text>
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
  rehearsalActors: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 20,
  },
};

export default RehearsalsDisplay;
