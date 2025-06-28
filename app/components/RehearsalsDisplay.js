import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const RehearsalsDisplay = ({ rehearsals, onDeleteRehearsal, isAdmin = false }) => {
  if (rehearsals.length === 0) {
    return (
      <View style={styles.rehearsalsContainer}>
        <Text style={styles.rehearsalsTitle}>📅 Scheduled Rehearsals</Text>
        <Text style={styles.noRehearsalsText}>No rehearsals scheduled yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.rehearsalsContainer}>
      <Text style={styles.rehearsalsTitle}>📅 Scheduled Rehearsals ({rehearsals.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rehearsalsScroll}>
        {rehearsals.map((rehearsal, index) => (
          <View key={index} style={styles.rehearsalCard}>
            <View style={styles.rehearsalHeader}>
              <Text style={styles.rehearsalTitle}>{rehearsal.title}</Text>
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.deleteRehearsalButton}
                  onPress={() => onDeleteRehearsal(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteRehearsalText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.rehearsalTime}>{rehearsal.timeslot.label}</Text>
            <Text style={styles.rehearsalActors}>
              {rehearsal.actors.map(actor => actor.name).join(', ')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = {
  rehearsalsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rehearsalsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  noRehearsalsText: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  rehearsalsScroll: {
    flexGrow: 0,
  },
  rehearsalCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    minWidth: 220,
    maxWidth: 280,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rehearsalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rehearsalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    letterSpacing: 0.2,
  },  deleteRehearsalButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  deleteRehearsalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rehearsalTime: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  rehearsalActors: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
};

export default RehearsalsDisplay;
