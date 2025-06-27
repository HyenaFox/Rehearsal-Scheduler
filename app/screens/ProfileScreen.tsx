import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

export default function ProfileScreen() {
  const { user, updateProfile, forceLogout, isLoading: authLoading } = useAuth();
  const { actors, setActors, timeslots, scenes } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isActor, setIsActor] = useState(user?.isActor || false);
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>(user?.availableTimeslots || []);
  const [selectedScenes, setSelectedScenes] = useState<string[]>(user?.scenes || []);
  const [isLoading, setIsLoading] = useState(false);

  const isGuestUser = user?.id === 'guest';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    console.log(`🎭 Saving profile with isActor: ${isActor}, user.isActor: ${user?.isActor}`);
    console.log('🔍 User object:', { id: user?.id, email: user?.email, name: user?.name });

    setIsLoading(true);
    
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        isActor,
        availableTimeslots: isActor ? selectedTimeslots : [],
        scenes: isActor ? selectedScenes : [],
      };

      await updateProfile(updates);

      // Handle actor status changes
      if (isActor && user) {
        const existingActorIndex = actors.findIndex(actor => actor.id === user.id);
        const actorData = {
          id: user.id,
          name: name.trim(),
          availableTimeslots: selectedTimeslots,
          scenes: selectedScenes.map(sceneId => {
            const scene = scenes.find((s: any) => s.id === sceneId);
            return scene ? scene.title : sceneId;
          })
        };

        try {
          if (existingActorIndex >= 0) {
            // Update existing actor in database
            if (!user.id) {
              console.error('❌ User ID is missing, cannot update actor');
              throw new Error('User ID is required to update actor');
            }
            console.log('🔄 Updating actor with ID:', user.id);
            await ApiService.updateActor(user.id, actorData);
            const updatedActors = [...actors];
            updatedActors[existingActorIndex] = actorData;
            setActors(updatedActors);
            console.log('✅ Actor updated in database');
          } else {
            // Create new actor in database
            const createdActor = await ApiService.createActor(actorData);
            setActors([...actors, createdActor]);
            console.log('✅ Actor created in database');
          }
        } catch (error) {
          console.error('❌ Error managing actor in database:', error);
          // Don't throw error here, profile was still updated
        }
      } else if (!isActor && user) {
        // Remove from actors list if no longer an actor
        try {
          const existingActorIndex = actors.findIndex(actor => actor.id === user.id);
          if (existingActorIndex >= 0) {
            await ApiService.deleteActor(user.id);
            const updatedActors = actors.filter(actor => actor.id !== user.id);
            setActors(updatedActors);
            console.log('✅ Actor removed from database');
          }
        } catch (error) {
          console.error('❌ Error removing actor from database:', error);
          // Don't throw error here, profile was still updated
        }
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

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={() => {
          console.log('Force logout button pressed');
          forceLogout();
          Alert.alert('Force Logout', "You're logged out (force)!");
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
          <View style={styles.actorToggleContainer}>
            <Text style={styles.sectionTitle}>Actor Profile</Text>
            <Switch
              value={isActor}
              onValueChange={setIsActor}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isActor ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <Text style={styles.helperText}>
            Enable this to add yourself as an actor in the system
          </Text>

          {isActor && (
            <>
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Available Timeslots</Text>
                {timeslots.map((timeslot: any) => (
                  <TouchableOpacity
                    key={timeslot.id}
                    style={[
                      styles.checkboxItem,
                      selectedTimeslots.includes(timeslot.id) && styles.checkboxItemSelected
                    ]}
                    onPress={() => toggleTimeslot(timeslot.id)}
                  >
                    <Text style={[
                      styles.checkboxText,
                      selectedTimeslots.includes(timeslot.id) && styles.checkboxTextSelected
                    ]}>
                      {timeslot.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Scenes</Text>
                {scenes.map((scene: any) => (
                  <TouchableOpacity
                    key={scene.id}
                    style={[
                      styles.checkboxItem,
                      selectedScenes.includes(scene.id) && styles.checkboxItemSelected
                    ]}
                    onPress={() => toggleScene(scene.id)}
                  >
                    <Text style={[
                      styles.checkboxText,
                      selectedScenes.includes(scene.id) && styles.checkboxTextSelected
                    ]}>
                      {scene.title}
                    </Text>
                    {scene.description && (
                      <Text style={styles.sceneDescription}>{scene.description}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Google Calendar Integration Section */}
        {isActor && (
          <GoogleCalendarIntegration 
            onSlotsImported={(slots) => {
              // Handle imported slots - you can add logic here to merge with existing timeslots
              console.log('Slots imported:', slots);
              // Optionally refresh the profile data
            }}
          />
        )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  forceLogoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ff9500',
    borderRadius: 6,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 12,
  },
  actorToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subsection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  checkboxItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  checkboxItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
  },
  checkboxTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sceneDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});
