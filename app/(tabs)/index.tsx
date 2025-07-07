import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import AddRehearsalModal from '../components/AddRehearsalModal';
import AutoSchedulerModal from '../components/AutoSchedulerModal';
import RehearsalsDisplay from '../components/RehearsalsDisplay';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/common';

export default function RehearsalsScreen() {
  const { actors, rehearsals, handleDeleteRehearsal, handleAddRehearsal, handleAddMultipleRehearsals } = useApp();
  const { user } = useAuth();
  
  // Admin check for admin-only actions
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
    <SafeAreaView style={commonStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={commonStyles.contentContainer}>
        <View style={commonStyles.headerSection}>
          <View style={commonStyles.screenTitleContainer}>
            <Text style={commonStyles.screenTitle}>📅 Shows</Text>
          </View>
          <Text style={commonStyles.subtitle}>
            Manage rehearsals and schedule your production
          </Text>
          
          {/* Action Buttons */}
          {isAdmin && (
            <View style={showStyles.buttonRow}>
              <ActionButton 
                title="➕ Add Show" 
                onPress={handleAddRehearsalButton} 
                style={[showStyles.actionButton, { backgroundColor: '#10b981' }]} 
              />
              <ActionButton 
                title="🤖 Auto Schedule" 
                onPress={handleAutoScheduler} 
                style={[showStyles.actionButton, { backgroundColor: '#6366f1' }]} 
              />
            </View>
          )}
        </View>
          
        <ScrollView 
          style={commonStyles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <RehearsalsDisplay
            rehearsals={rehearsals}
            onDeleteRehearsal={handleDeleteRehearsal}
            isAdmin={isAdmin}
          />
        </ScrollView>
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

const showStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});
