import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ApiService from '../services/api';

interface GoogleCalendarIntegrationProps {
  onSlotsImported?: (slots: any[]) => void;
}

interface CalendarSlot {
  day: string;
  time: string;
  start: string;
  end: string;
}

interface CalendarStatus {
  isConnected: boolean;
  googleEmail?: string;
  hasAvailableSlots: boolean;
}

export default function GoogleCalendarIntegration({ onSlotsImported }: GoogleCalendarIntegrationProps) {
  const [status, setStatus] = useState<CalendarStatus>({ isConnected: false, hasAvailableSlots: false });
  const [availableSlots, setAvailableSlots] = useState<CalendarSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<CalendarSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const loadAvailableSlots = useCallback(async () => {
    try {
      setIsLoadingSlots(true);
      const slotsResult = await ApiService.getAvailableSlots();
      setAvailableSlots(slotsResult.availableSlots || []);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      Alert.alert('Error', 'Failed to load available time slots from Google Calendar');
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusResult = await ApiService.getGoogleCalendarStatus();
      setStatus(statusResult);
      
      if (statusResult.isConnected) {
        await loadAvailableSlots();
      }
    } catch (error) {
      console.error('Failed to load calendar status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAvailableSlots]);

  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const url = event.url;
    console.log('Deep link received:', url);
    
    // Parse the URL to extract the authorization code
    const urlParts = url.split('?');
    if (urlParts.length > 1) {
      const params = new URLSearchParams(urlParts[1]);
      const code = params.get('code');
      const error = params.get('error');
      
      if (error) {
        Alert.alert('Authorization Error', 'Google Calendar authorization was cancelled or failed.');
        return;
      }
      
      if (code) {
        try {
          setIsLoading(true);
          await ApiService.handleGoogleCallback(code);
          Alert.alert('Success', 'Google Calendar connected successfully!');
          await loadStatus();
        } catch (error) {
          console.error('Failed to handle Google callback:', error);
          Alert.alert('Error', 'Failed to connect Google Calendar. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [loadStatus]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    // Handle deep linking for OAuth callback
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, [handleDeepLink]);

  const connectGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      const authUrl = await ApiService.getGoogleAuthUrl();
      
      // Open the Google OAuth page in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('/oauth-callback')
      );
      
      if (result.type === 'success' && result.url) {
        // Handle the callback URL
        await handleDeepLink({ url: result.url });
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Google Calendar authorization was cancelled.');
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      Alert.alert('Error', 'Failed to connect Google Calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'Are you sure you want to disconnect your Google Calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await ApiService.disconnectGoogleCalendar();
              setStatus({ isConnected: false, hasAvailableSlots: false });
              setAvailableSlots([]);
              setSelectedSlots([]);
              Alert.alert('Success', 'Google Calendar disconnected successfully!');
            } catch (error) {
              console.error('Failed to disconnect Google Calendar:', error);
              Alert.alert('Error', 'Failed to disconnect Google Calendar.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleSlotSelection = (slot: CalendarSlot) => {
    setSelectedSlots(prev => {
      const isSelected = prev.some(s => s.start === slot.start && s.end === slot.end);
      if (isSelected) {
        return prev.filter(s => !(s.start === slot.start && s.end === slot.end));
      } else {
        return [...prev, slot];
      }
    });
  };

  const importSelectedSlots = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert('No Slots Selected', 'Please select at least one time slot to import.');
      return;
    }

    try {
      setIsLoading(true);
      await ApiService.importSelectedSlots(selectedSlots);
      Alert.alert('Success', `Imported ${selectedSlots.length} time slots to your profile!`);
      onSlotsImported?.(selectedSlots);
      setSelectedSlots([]);
    } catch (error) {
      console.error('Failed to import slots:', error);
      Alert.alert('Error', 'Failed to import time slots. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSlotTime = (slot: CalendarSlot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Google Calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Calendar Integration</Text>
      
      {!status.isConnected ? (
        <View style={styles.disconnectedContainer}>
          <Text style={styles.description}>
            Connect your Google Calendar to automatically import your available time slots.
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={connectGoogleCalendar}>
            <Text style={styles.connectButtonText}>Connect Google Calendar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.connectedContainer}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>✅ Connected to {status.googleEmail}</Text>
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnectGoogleCalendar}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          {isLoadingSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading available slots...</Text>
            </View>
          ) : (
            <>
              {availableSlots.length > 0 ? (
                <View style={styles.slotsContainer}>
                  <Text style={styles.slotsTitle}>Available Time Slots (Next 7 Days)</Text>
                  <ScrollView style={styles.slotsList} showsVerticalScrollIndicator={false}>
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                          onPress={() => toggleSlotSelection(slot)}
                        >
                          <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                            {formatSlotTime(slot)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  
                  {selectedSlots.length > 0 && (
                    <TouchableOpacity style={styles.importButton} onPress={importSelectedSlots}>
                      <Text style={styles.importButtonText}>
                        Import {selectedSlots.length} Selected Slot{selectedSlots.length !== 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>No available time slots found in your calendar.</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadAvailableSlots}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  disconnectedContainer: {
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedContainer: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dc3545',
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  slotsContainer: {
    flex: 1,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  slotsList: {
    maxHeight: 200,
  },
  slotItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  slotItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
  },
  slotTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noSlotsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
