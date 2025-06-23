import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import AddRehearsalModal from '../components/AddRehearsalModal';
import RehearsalsDisplay from '../components/RehearsalsDisplay';
import { useApp } from '../contexts/AppContext';

export default function RehearsalsScreen() {
  const { actors, rehearsals, setRehearsals, handleDeleteRehearsal } = useApp();
  const [addRehearsalModalVisible, setAddRehearsalModalVisible] = useState(false);

  const handleAddRehearsal = () => {
    setAddRehearsalModalVisible(true);
  };

  const handleSaveRehearsal = (newRehearsal: any) => {
    const updatedRehearsals = [...rehearsals, newRehearsal];
    setRehearsals(updatedRehearsals);
    setAddRehearsalModalVisible(false);
  };

  const handleCancelAddRehearsal = () => {
    setAddRehearsalModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>📅 Rehearsals</Text>
          <ActionButton title="Add Rehearsal" onPress={handleAddRehearsal} style={undefined} />
          <RehearsalsDisplay
            rehearsals={rehearsals}
            onDeleteRehearsal={handleDeleteRehearsal}
          />
        </View>
      </View>

      {/* Modals */}
      <AddRehearsalModal
        visible={addRehearsalModalVisible}
        onSave={handleSaveRehearsal}
        onCancel={handleCancelAddRehearsal}
        actors={actors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
});
