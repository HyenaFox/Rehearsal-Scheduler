import React, { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import AddRehearsalModal from '../components/AddRehearsalModal';
import AutoSchedulerModal from '../components/AutoSchedulerModal';
import RehearsalsDisplay from '../components/RehearsalsDisplay';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export default function RehearsalsScreen() {
  const { actors, rehearsals, handleDeleteRehearsal, handleAddRehearsal, handleAddMultipleRehearsals } = useApp();
  const { user } = useAuth();
  
  // Admin check
  const isAdmin = user?.isAdmin || false;
  
  const [addRehearsalModalVisible, setAddRehearsalModalVisible] = useState(false);
  const [autoSchedulerModalVisible, setAutoSchedulerModalVisible] = useState(false);

  const handleAddRehearsalButton = () => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can add rehearsals.');
      return;
    }
    setAddRehearsalModalVisible(true);
  };

  const handleAutoScheduler = () => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can use the auto-scheduler.');
      return;
    }
    setAutoSchedulerModalVisible(true);
  };

  const handleSaveRehearsal = (newRehearsal: any) => {
    handleAddRehearsal(newRehearsal);
    setAddRehearsalModalVisible(false);
  };

  const handleSaveAutoRehearsal = (data: any, isMultiple: boolean = false) => {
    if (isMultiple && Array.isArray(data)) {
      handleAddMultipleRehearsals(data);
    } else {
      handleAddRehearsal(data);
    }
    setAutoSchedulerModalVisible(false);
  };

  const handleCancelAddRehearsal = () => {
    setAddRehearsalModalVisible(false);
  };

  const handleCancelAutoScheduler = () => {
    setAutoSchedulerModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>📅 Rehearsals</Text>
          
          {/* Action Buttons */}          <View style={styles.buttonRow}>
            <ActionButton 
              title="Add Rehearsal" 
              onPress={handleAddRehearsalButton} 
              style={[styles.actionButton, { backgroundColor: '#10b981' }]} 
            />
            <ActionButton 
              title="🤖 Auto Schedule" 
              onPress={handleAutoScheduler} 
              style={[styles.actionButton, { backgroundColor: '#6366f1' }]} 
            />
          </View>
          
          <RehearsalsDisplay
            rehearsals={rehearsals}
            onDeleteRehearsal={handleDeleteRehearsal}
            isAdmin={isAdmin}
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
      
      <AutoSchedulerModal
        visible={autoSchedulerModalVisible}
        onSave={handleSaveAutoRehearsal}
        onCancel={handleCancelAutoScheduler}
        actors={actors}
        existingRehearsals={rehearsals}
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
