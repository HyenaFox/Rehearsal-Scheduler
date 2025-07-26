import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import AddRehearsalModal from '../components/AddRehearsalModal';
import AutoSchedulerModal from '../components/AutoSchedulerModal';
import RehearsalsDisplay from '../components/RehearsalsDisplay';
import WeeklyRehearsalsView from '../components/WeeklyRehearsalsView';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/common';

export default function RehearsalsScreen() {
  const { actors, rehearsals, scenes, handleDeleteRehearsal, handleAddRehearsal, handleAddMultipleRehearsals } = useApp();
  const { user } = useAuth();
  
  // Admin check for admin-only actions
  const isAdmin = user?.isAdmin || false;
  
  const [addRehearsalModalVisible, setAddRehearsalModalVisible] = useState(false);
  const [autoSchedulerModalVisible, setAutoSchedulerModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list');

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
          
          {/* View Toggle */}
          <View style={showStyles.viewToggle}>
            <TouchableOpacity
              style={[showStyles.toggleButton, viewMode === 'list' && showStyles.activeToggle]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[showStyles.toggleText, viewMode === 'list' && showStyles.activeToggleText]}>
                📋 List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[showStyles.toggleButton, viewMode === 'weekly' && showStyles.activeToggle]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[showStyles.toggleText, viewMode === 'weekly' && showStyles.activeToggleText]}>
                📅 Weekly
              </Text>
            </TouchableOpacity>
          </View>

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
          
        {viewMode === 'list' ? (
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
        ) : (
          <WeeklyRehearsalsView
            rehearsals={rehearsals}
          />
        )}
      </View>

      {/* Modals */}
      <AddRehearsalModal
        visible={addRehearsalModalVisible}
        onSave={handleSaveRehearsal}
        onCancel={handleCancelAddRehearsal}
        actors={actors as any}
        scenes={scenes as any}
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeToggleText: {
    color: '#1e293b',
    fontWeight: '600',
  },
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
