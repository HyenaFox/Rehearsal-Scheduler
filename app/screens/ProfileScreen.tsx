import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import LoginScreen from './LoginScreen';

export default function ProfileScreen() {
  const { user, updateProfile, forceLogout, isLoading: authLoading } = useAuth();
  const { setActors, timeslots, scenes } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isActor, setIsActor] = useState(user?.isActor || false);
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>(user?.availableTimeslots || []);
  const [selectedScenes, setSelectedScenes] = useState<string[]>(user?.scenes || []);
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

      // The backend will automatically handle the actor status in the user record
      // No need to manually create/update in actors collection since getAllActors()
      // fetches users where isActor: true
      
      console.log('✅ Profile updated successfully, refreshing actor list...');
      
      // Refresh the actors list to reflect the changes
      try {
        const updatedActors = await ApiService.getAllActors();
        setActors(updatedActors);
        console.log('✅ Actors list refreshed');
      } catch (error) {
        console.error('❌ Error refreshing actors list:', error);
        // Don't throw error here, profile was still updated
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
    console.log('🔍 ProfileScreen - Showing loading (authLoading: true)');
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Only show login screen if we're definitely not authenticated AND not loading
  if (!user && !authLoading) {
    return <LoginScreen />;
  }

  // If we have a user, show the profile screen
  if (!user) {
    // Loading state - show loading indicator
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Error: No user data</Text>
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
            onSlotsImported={async (slots) => {
              // Handle imported slots - merge with existing selections
              console.log('Slots imported:', slots);
              const merged = [...new Set([...selectedTimeslots, ...slots])];
              console.log('Merged timeslots:', merged);
              setSelectedTimeslots(merged);
              
              // Automatically save the updated availability
              try {
                const updates = {
                  name: name.trim(),
                  phone: phone.trim(),
                  isActor,
                  availableTimeslots: merged,
                  scenes: selectedScenes,
                };
                
                console.log('🗓️ Auto-saving imported availability:', updates);
                await updateProfile(updates);
                
                // Refresh the actors list
                const updatedActors = await ApiService.getAllActors();
                setActors(updatedActors);
                
                Alert.alert('Success', 'Availability imported and saved successfully!');
              } catch (error) {
                console.error('Error saving imported availability:', error);
                Alert.alert('Warning', 'Availability imported but failed to save. Please click Save to persist your changes.');
              }
            }}
          />
        )}

        {/* Admin Section */}
        {user.isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👑 Administrator</Text>
            <Text style={styles.adminNotice}>
              You have administrator privileges. You can create, edit, and delete actors, scenes, timeslots, and rehearsals.
            </Text>
            
            <Text style={styles.adminNote}>
              To manage other administrators, contact the system administrator.
            </Text>
          </View>
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
  adminNotice: {
    fontSize: 14,
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  adminNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
