import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration';
import SimpleAuthGate from '../components/SimpleAuthGate';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

export default function ProfileScreen() {
  const { user, updateProfile, forceLogout } = useAuth();
  const { setActors, timeslots, scenes } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isActor, setIsActor] = useState(false);
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    setSelectedTimeslots(prev => 
      prev.includes(timeslotId) 
        ? prev.filter(id => id !== timeslotId)
        : [...prev, timeslotId]
    );
  };

  const toggleScene = (sceneId: string) => {
    setSelectedScenes(prev => 
      prev.includes(sceneId) 
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
    );
  };

  // The actual profile content
  const ProfileContent = () => {
    // Update local state when user changes
    React.useEffect(() => {
      if (user) {
        setName(user.name || '');
        setPhone(user.phone || '');
        setIsActor(user.isActor || false);
        setSelectedTimeslots(user.availableTimeslots || []);
        setSelectedScenes(user.scenes || []);
      }
    }, [user]);

    // Ensure user exists (SimpleAuthGate should guarantee this)
    if (!user) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading user data...</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={() => {
            forceLogout();
            Alert.alert('Logged Out', 'You have been logged out successfully');
          }}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
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
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <Text style={styles.sectionTitle}>Actor Settings</Text>
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
                  <Text style={styles.description}>
                    Select the time slots when you are available for rehearsals.
                  </Text>
                  
                  {timeslots.map((timeslot) => (
                    <View key={timeslot.id} style={styles.checkboxContainer}>
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          selectedTimeslots.includes(timeslot.id) && styles.checkboxSelected
                        ]}
                        onPress={() => toggleTimeslot(timeslot.id)}
                      >
                        {selectedTimeslots.includes(timeslot.id) && (
                          <Text style={styles.checkboxText}>✓</Text>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.checkboxLabel}>
                        {timeslot.day} - {timeslot.startTime} to {timeslot.endTime}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Scenes</Text>
                  <Text style={styles.description}>
                    Select the scenes you are involved in.
                  </Text>
                  
                  {scenes.map((scene) => (
                    <View key={scene.id} style={styles.checkboxContainer}>
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          selectedScenes.includes(scene.id) && styles.checkboxSelected
                        ]}
                        onPress={() => toggleScene(scene.id)}
                      >
                        {selectedScenes.includes(scene.id) && (
                          <Text style={styles.checkboxText}>✓</Text>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.checkboxLabel}>
                        {scene.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {user.isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <GoogleCalendarIntegration />
          </View>
        )}
      </ScrollView>
    );
  };

  // Wrap the entire component with SimpleAuthGate
  return (
    <SimpleAuthGate>
      <ProfileContent />
    </SimpleAuthGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    padding: 20,
    paddingTop: 10,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: 0.2,
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
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1e293b',
  },
  emailText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  },
  subsection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
