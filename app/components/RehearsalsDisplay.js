import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const RehearsalsDisplay = ({ rehearsals, onDeleteRehearsal }) => {
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
              <TouchableOpacity 
                style={styles.deleteRehearsalButton}
                onPress={() => onDeleteRehearsal(index)}
              >
                <Text style={styles.deleteRehearsalText}>×</Text>
              </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rehearsalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noRehearsalsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  rehearsalsScroll: {
    flexGrow: 0,
  },
  rehearsalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    maxWidth: 250,
  },
  rehearsalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rehearsalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deleteRehearsalButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteRehearsalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rehearsalTime: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 4,
  },
  rehearsalActors: {
    fontSize: 12,
    color: '#666',
  },
};

export default RehearsalsDisplay;
