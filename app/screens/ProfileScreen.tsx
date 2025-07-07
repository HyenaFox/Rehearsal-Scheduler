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
  const [saveStatus, setSaveStatus] = useState('');
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

    if (!user) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    setSaveStatus('Updating profile...');
    
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        isActor,
        availableTimeslots: isActor ? selectedTimeslots : [],
        scenes: isActor ? selectedScenes : [],
      };

      console.log(`🎭 Starting profile update with isActor: ${isActor}`, updates);
      console.log('🎭 Selected timeslots:', selectedTimeslots);
      console.log('🎭 Selected scenes:', selectedScenes);
      console.log('🎭 Available timeslots data:', timeslots.map(t => ({ id: t.id || t._id, day: t.day })));
      console.log('🎭 Available scenes data:', scenes.map(s => ({ id: s.id || s._id, name: s.name })));
      
      // STEP 1: Update the user profile
      console.log('🔄 STEP 1: Updating user profile...');
      setSaveStatus('Updating profile...');
      const updatedUser = await updateProfile(updates);
      console.log('✅ STEP 1: Profile updated successfully', updatedUser);

      // STEP 2: Triple verification for actors list (if user is becoming/staying an actor)
      if (isActor) {
        console.log('🔄 STEP 2: Starting triple verification for actors list...');
        setSaveStatus('Verifying actor status...');
        
        let verificationsPassed = 0;
        const maxVerifications = 3;
        const maxRetries = 5; // Increased retries for better reliability
        let finalActorsList = null;
        
        for (let verification = 1; verification <= maxVerifications; verification++) {
          console.log(`🔍 Verification ${verification}/${maxVerifications}: Checking actors list...`);
          setSaveStatus(`Verification ${verification}/${maxVerifications}: Checking actors list...`);
          
          let userFoundInActors = false;
          let retryCount = 0;
          
          while (!userFoundInActors && retryCount < maxRetries) {
            try {
              // Add delay before each check to allow backend sync
              if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
              
              const actors = await ApiService.getAllActors();
              console.log(`🔍 Verification ${verification}, Attempt ${retryCount + 1}: Retrieved ${actors.length} actors`);
              
              // Multiple matching criteria for robust verification
              userFoundInActors = actors.some(actor => {
                const emailMatch = actor.email === user.email;
                const idMatch = actor.id === user.id || actor._id === user.id;
                const nameMatch = actor.name === updates.name;
                
                if (emailMatch || idMatch || nameMatch) {
                  console.log('✅ User found in actors list:', {
                    actorId: actor.id || actor._id,
                    actorName: actor.name,
                    actorEmail: actor.email,
                    matchedBy: emailMatch ? 'email' : idMatch ? 'id' : 'name'
                  });
                  return true;
                }
                return false;
              });
              
              if (userFoundInActors) {
                verificationsPassed++;
                finalActorsList = actors;
                console.log(`✅ Verification ${verification} PASSED: User confirmed in actors list`);
                break;
              } else {
                console.log(`⚠️ Verification ${verification}, Attempt ${retryCount + 1}: User not found in actors list, retrying...`);
                retryCount++;
              }
            } catch (error) {
              console.error(`❌ Verification ${verification}, Attempt ${retryCount + 1} failed:`, error);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          if (!userFoundInActors) {
            console.log(`❌ Verification ${verification} FAILED: User not found in actors list after ${maxRetries} attempts`);
          }
          
          // Short delay between verifications
          if (verification < maxVerifications) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // STEP 3: Update local actors state with the most recent data
        if (finalActorsList) {
          console.log('🔄 STEP 3: Updating local actors state...');
          setSaveStatus('Updating local data...');
          setActors(finalActorsList);
          console.log('✅ STEP 3: Local actors list updated with latest data');
        }

        // STEP 4: Provide detailed feedback based on verification results
        console.log(`🎯 Verification Summary: ${verificationsPassed}/${maxVerifications} verifications passed`);
        
        if (verificationsPassed === maxVerifications) {
          Alert.alert(
            'Profile Updated Successfully! ✅',
            `Excellent! Your profile has been updated and you are confirmed to be listed as an actor. All ${maxVerifications} verification checks passed successfully.\n\nYou can now be scheduled for rehearsals based on your availability.`,
            [{ text: 'Great!' }]
          );
          console.log('🎉 COMPLETE SUCCESS: All verifications passed');
        } else if (verificationsPassed >= 2) {
          Alert.alert(
            'Profile Updated Successfully ✅',
            `Your profile has been updated and you should be listed as an actor. ${verificationsPassed} out of ${maxVerifications} verification checks passed.\n\nIf you don't see yourself in the Actors tab immediately, please refresh the app.`,
            [{ text: 'OK' }]
          );
          console.log('✅ MOSTLY SUCCESSFUL: Most verifications passed');
        } else if (verificationsPassed >= 1) {
          Alert.alert(
            'Profile Updated with Minor Issues ⚠️',
            `Your profile has been updated, but there may be a short delay in appearing in the actors list. ${verificationsPassed} verification check(s) passed.\n\nPlease check the Actors tab in a few moments, or try refreshing the app.`,
            [{ text: 'OK' }]
          );
          console.log('⚠️ PARTIAL SUCCESS: Some verifications passed');
        } else {
          Alert.alert(
            'Profile Updated - Verification Pending ⚠️',
            'Your profile has been updated on the server, but we could not immediately verify your addition to the actors list. This may be due to network delays.\n\nPlease:\n1. Check the Actors tab in a few moments\n2. Try refreshing the app\n3. Contact support if the issue persists',
            [{ text: 'Understood' }]
          );
          console.log('❌ VERIFICATION FAILED: User may not be properly added to actors list');
        }
      } else {
        // User is not an actor - simple success message
        console.log('✅ User is not an actor, profile update complete');
        Alert.alert(
          'Profile Updated Successfully ✅',
          'Your profile has been updated successfully.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('❌ Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Update Failed ❌', 
        `Failed to update profile: ${errorMessage}\n\nPlease check your internet connection and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setSaveStatus('');
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
                  Select from the global time slots when you are available for rehearsals. These time slots are created by administrators and available to all cast members.
                </Text>
                
                {timeslots.length === 0 ? (
                  <View style={styles.emptyTimeslots}>
                    <Text style={styles.emptyTimeslotsText}>
                      No global time slots have been created yet. Contact an admin to set up rehearsal times that will be available to all cast members.
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
                  Select from the global scenes that you are involved in. These scenes are created by administrators and available to all cast members.
                </Text>
                
                {scenes.length === 0 ? (
                  <View style={styles.emptyTimeslots}>
                    <Text style={styles.emptyTimeslotsText}>
                      No global scenes have been created yet. Contact an admin to set up scenes that will be available to all cast members.
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

        {/* Save Status Indicator */}
        {isLoading && saveStatus && (
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{saveStatus}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[commonStyles.actionButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={commonStyles.actionButtonText}>
            {isLoading ? (saveStatus || 'Saving...') : `Save Changes${isActor ? ' & Verify Actor Status' : ''}`}
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginRight: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
