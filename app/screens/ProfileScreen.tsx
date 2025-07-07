import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';
import LoginScreen from './LoginScreen';

export default function ProfileScreen() {
  const { user, updateProfile, forceLogout, isLoading: authLoading } = useAuth();
  const { setActors, timeslots, scenes } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isActor, setIsActor] = useState(false);
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  // Track the last user ID to prevent resetting form state on every render
  const lastUserIdRef = useRef<string | null>(null);
  
  // Update local state when user data is available (only when user changes)
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      console.log('👤 Initializing profile form with user data:', {
        name: user.name,
        phone: user.phone,
        isActor: user.isActor,
        availableTimeslots: user.availableTimeslots,
        scenes: user.scenes
      });
      setName(user.name || '');
      setPhone(user.phone || '');
      setIsActor(user.isActor || false);
      setSelectedTimeslots(user.availableTimeslots || []);
      setSelectedScenes(user.scenes || []);
      lastUserIdRef.current = user.id;
    }
  }, [user]);

  // If user wants to login, show login form
  if (showLogin && !user) {
    return <LoginScreen />;
  }

  // If no user, show login option
  if (!user && !authLoading) {
    return (
      <View style={commonStyles.screenContainer}>
        <View style={styles.headerSection}>
          <Text style={commonStyles.screenTitle}>👤 Profile</Text>
          <Text style={commonStyles.subtitle}>
            Manage your personal information and preferences
          </Text>
        </View>
        <View style={[commonStyles.card, styles.loginPromptCard]}>
          <Text style={styles.loginPromptText}>
            Login to manage your profile, set your availability, and participate in rehearsals.
          </Text>
          <TouchableOpacity 
            style={commonStyles.actionButton} 
            onPress={() => setShowLogin(true)}
          >
            <Text style={commonStyles.actionButtonText}>Login / Register</Text>
          </TouchableOpacity>
          <Text style={styles.loginNote}>
            You can still view rehearsals and other content without logging in.
          </Text>
        </View>
      </View>
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={commonStyles.screenContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        isActor,
        availableTimeslots: isActor ? selectedTimeslots : [],
        scenes: isActor ? selectedScenes : [],
      };

      console.log(`🎭 Updating profile with isActor: ${isActor}`, updates);
      console.log('🎭 Selected timeslots:', selectedTimeslots);
      console.log('🎭 Selected scenes:', selectedScenes);
      console.log('🎭 Available timeslots data:', timeslots.map(t => ({ id: t.id || t._id, day: t.day })));
      console.log('🎭 Available scenes data:', scenes.map(s => ({ id: s.id || s._id, name: s.name })));
      
      await updateProfile(updates);

      console.log('✅ Profile updated successfully, refreshing actor list...');
      
      try {
        const updatedActors = await ApiService.getAllActors();
        setActors(updatedActors);
        console.log('✅ Actors list refreshed');
      } catch (error) {
        console.error('❌ Error refreshing actors list:', error);
      }

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTimeslot = (timeslotId: string) => {
    console.log('🔄 Toggle timeslot clicked:', timeslotId);
    console.log('🔄 Current selectedTimeslots:', selectedTimeslots);
    setSelectedTimeslots(prev => {
      const newSelection = prev.includes(timeslotId) 
        ? prev.filter(id => id !== timeslotId)
        : [...prev, timeslotId];
      console.log('🔄 New selectedTimeslots:', newSelection);
      return newSelection;
    });
  };

  const toggleScene = (sceneId: string) => {
    console.log('🔄 Toggle scene clicked:', sceneId);
    console.log('🔄 Current selectedScenes:', selectedScenes);
    setSelectedScenes(prev => {
      const newSelection = prev.includes(sceneId) 
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId];
      console.log('🔄 New selectedScenes:', newSelection);
      return newSelection;
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Ensure user exists for the profile form
  if (!user) {
    return (
      <View style={commonStyles.screenContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.screenContainer}>
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <Text style={commonStyles.screenTitle}>👤 Profile</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={() => {
            forceLogout();
            Alert.alert('Logged Out', 'You have been logged out successfully');
          }}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        <Text style={commonStyles.subtitle}>
          Manage your personal information and preferences
        </Text>
      </View>

      <ScrollView style={commonStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={commonStyles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.emailText}>{user.email}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              style={commonStyles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={commonStyles.card}>
          <View style={styles.switchContainer}>
            <Text style={commonStyles.cardTitle}>Actor Settings</Text>
            <Switch
              value={isActor}
              onValueChange={setIsActor}
              trackColor={{ false: '#e2e8f0', true: '#10b981' }}
              thumbColor={isActor ? '#ffffff' : '#f4f4f5'}
            />
          </View>
          
          <Text style={styles.description}>
            Enable this if you are an actor and want to specify your availability and scenes.
          </Text>

          {isActor && (
            <>
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Available Time Slots</Text>
                <Text style={styles.subsectionDescription}>
                  Select the time slots when you are available for rehearsals.
                </Text>
                
                {timeslots.length === 0 ? (
                  <View style={styles.emptyTimeslots}>
                    <Text style={styles.emptyTimeslotsText}>
                      No time slots have been created yet. Contact an admin to set up rehearsal times.
                    </Text>
                  </View>
                ) : (
                  timeslots.map((timeslot) => {
                    const timeslotId = timeslot.id || timeslot._id;
                    const isSelected = selectedTimeslots.includes(timeslotId);
                    return (
                      <View key={timeslotId} style={styles.timeslotRow}>
                        <View style={styles.timeslotInfo}>
                          <Text style={styles.timeslotDay}>{timeslot.day}</Text>
                          <Text style={styles.timeslotTime}>
                            {timeslot.startTime} - {timeslot.endTime}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.availabilityButton,
                            isSelected ? styles.availableButton : styles.unavailableButton
                          ]}
                          onPress={() => toggleTimeslot(timeslotId)}
                        >
                          <Text style={[
                            styles.availabilityButtonText,
                            isSelected ? styles.availableButtonText : styles.unavailableButtonText
                          ]}>
                            {isSelected ? '✅ Available' : '❌ Unavailable'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Scenes</Text>
                <Text style={styles.subsectionDescription}>
                  Select the scenes you are involved in.
                </Text>
                
                {scenes.length === 0 ? (
                  <View style={styles.emptyTimeslots}>
                    <Text style={styles.emptyTimeslotsText}>
                      No scenes have been created yet. Contact an admin to set up scenes.
                    </Text>
                  </View>
                ) : (
                  scenes.map((scene) => {
                    const sceneId = scene.id || scene._id;
                    const isSelected = selectedScenes.includes(sceneId);
                    return (
                      <View key={sceneId} style={styles.checkboxContainer}>
                        <TouchableOpacity
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected
                          ]}
                          onPress={() => toggleScene(sceneId)}
                        >
                          {isSelected && (
                            <Text style={styles.checkboxText}>✓</Text>
                          )}
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel}>
                          {scene.name}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </View>

        <TouchableOpacity 
          style={[commonStyles.actionButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={commonStyles.actionButtonText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {user.isAdmin && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Admin Tools</Text>
            <GoogleCalendarIntegration />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  emailText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 18,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  subsection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subsectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  loginPromptCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontWeight: '500',
  },
  loginNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyTimeslots: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyTimeslotsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  timeslotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeslotInfo: {
    flex: 1,
  },
  timeslotDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  timeslotTime: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  availabilityButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  availableButton: {
    backgroundColor: '#10b981',
  },
  unavailableButton: {
    backgroundColor: '#ef4444',
  },
  availabilityButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  availableButtonText: {
    color: '#ffffff',
  },
  unavailableButtonText: {
    color: '#ffffff',
  },
});
