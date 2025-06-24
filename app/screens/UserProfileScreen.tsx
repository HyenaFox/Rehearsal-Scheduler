import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { GLOBAL_SCENES, GLOBAL_TIMESLOTS } from '../types/index';

const UserProfileScreen = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setContactInfo(userProfile.contactInfo || '');
      setNotes(userProfile.notes || '');
      setSelectedTimeslots(userProfile.availableTimeslots || []);
      setSelectedScenes(userProfile.scenes || []);
    }
  }, [userProfile]);

  // Listen for authentication state changes
  useEffect(() => {
    if (!currentUser) {
      console.log('User is null, should redirect to login');
      router.replace('/');
    }
  }, [currentUser, router]);

  const toggleTimeslot = (timeslotId: string) => {
    setSelectedTimeslots(prev => 
      prev.includes(timeslotId)
        ? prev.filter(id => id !== timeslotId)
        : [...prev, timeslotId]
    );
  };

  const toggleScene = (sceneTitle: string) => {
    setSelectedScenes(prev => 
      prev.includes(sceneTitle)
        ? prev.filter(title => title !== sceneTitle)
        : [...prev, sceneTitle]
    );
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setIsSaving(true);
    await updateUserProfile({
      displayName: displayName.trim(),
      contactInfo: contactInfo.trim(),
      notes: notes.trim(),
      availableTimeslots: selectedTimeslots,
      scenes: selectedScenes,
    });
    setIsSaving(false);

    Alert.alert('Success', 'Your profile has been updated!');
  };
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('Logout button pressed');
              await logout();
              console.log('Logout completed, navigating...');
              // Show a confirmation message before navigating
              Alert.alert('Logged Out', 'You have been successfully logged out.', [
                { 
                  text: 'OK', 
                  onPress: () => {
                    // Use router.replace to ensure we don't go back
                    router.replace('/');
                  }
                }
              ]);
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!currentUser || !userProfile) {
    // Show login option when not authenticated
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>👤 Profile</Text>
          <Text style={styles.guestText}>
            Log in to create your personal profile and:
            {'\n\n'}• Set your availability
            {'\n'}• Choose your scenes
            {'\n'}• Get smart rehearsal suggestions
            {'\n'}• Keep your info private
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
          <Text style={styles.guestNote}>
            You can still use the app without logging in!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>👤 My Profile</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How others will see your name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Info (Optional)</Text>
            <TextInput
              style={styles.input}
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="Phone, email, etc."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about your availability or preferences"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ My Availability</Text>          <Text style={styles.sectionSubtitle}>
            Select the timeslots when you&apos;re available for rehearsals
          </Text>
          
          {GLOBAL_TIMESLOTS.map(timeslot => (
            <TouchableOpacity
              key={timeslot.id}
              style={[
                styles.selectionItem,
                selectedTimeslots.includes(timeslot.id) && styles.selectedItem
              ]}
              onPress={() => toggleTimeslot(timeslot.id)}
            >
              <Text style={[
                styles.selectionText,
                selectedTimeslots.includes(timeslot.id) && styles.selectedText
              ]}>
                {timeslot.label}
              </Text>
              {selectedTimeslots.includes(timeslot.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Scenes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎬 My Scenes</Text>          <Text style={styles.sectionSubtitle}>
            Select the scenes you&apos;re involved in
          </Text>
          
          {GLOBAL_SCENES.map(scene => (
            <TouchableOpacity
              key={scene.id}
              style={[
                styles.selectionItem,
                selectedScenes.includes(scene.title) && styles.selectedItem
              ]}
              onPress={() => toggleScene(scene.title)}
            >
              <View style={styles.sceneItem}>
                <Text style={[
                  styles.selectionText,
                  selectedScenes.includes(scene.title) && styles.selectedText
                ]}>
                  {scene.title}
                </Text>
                <Text style={[
                  styles.sceneDescription,
                  selectedScenes.includes(scene.title) && styles.selectedDescription
                ]}>
                  {scene.description}
                </Text>
              </View>
              {selectedScenes.includes(scene.title) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Your profile information is stored locally on your device and helps the auto-scheduler 
            find the best rehearsal times for everyone.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#6366f1',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  username: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#6366f1',
  },
  selectionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedText: {
    color: '#1e40af',
  },
  sceneItem: {
    flex: 1,
  },
  sceneDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  selectedDescription: {
    color: '#3730a3',
  },
  checkmark: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 18,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  guestText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestNote: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default UserProfileScreen;
