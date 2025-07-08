import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface GoogleCalendarIntegrationProps {
  onSlotsImported?: (slots: string[]) => void;
}

export default function GoogleCalendarIntegration({ onSlotsImported }: GoogleCalendarIntegrationProps) {
  const { user } = useAuth();
  const { timeslots } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  console.log('GoogleCalendarIntegration render - isConnected:', isConnected, 'user:', user?.id);

  const handleGoogleConnect = async () => {
    if (!user || user.id === 'guest') {
      Alert.alert('Error', 'Please log in to connect Google Calendar');
      return;
    }

    setIsLoading(true);
    try {
      // Get Google OAuth URL from backend
      const authUrl = await ApiService.getGoogleAuthUrl();
      
      console.log('Opening OAuth popup with URL:', authUrl);
      
      // Open popup window for Google OAuth
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        Alert.alert('Error', 'Popup blocked. Please allow popups for this site and try again.');
        setIsLoading(false);
        return;
      }

      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          console.log('Popup closed, checking connection status...');
          setIsLoading(false);
          // Check if user was successfully connected
          setTimeout(() => {
            checkConnectionStatus();
          }, 1000); // Wait a bit before checking status
        }
      }, 1000);

      // Listen for messages from the popup (auth success)
      const messageListener = async (event: MessageEvent) => {
        console.log('Message received from:', event.origin, 'Data:', event.data);
        
        // Allow messages from both frontend and backend origins
        const allowedOrigins = [
          window.location.origin, // Frontend origin (e.g., http://localhost:8081)
          'http://localhost:3000', // Backend origin
          'https://accounts.google.com' // Google origin
        ];
        
        if (!allowedOrigins.includes(event.origin)) {
          console.log('Ignored message from origin:', event.origin);
          return;
        }
        
        console.log('Processing message:', event.data);
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('Google auth success received!');
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', messageListener);
          
          // Backend has already processed the OAuth, just update the UI
          console.log('Google auth success received, updating UI state');
          setIsConnected(true);
          setIsLoading(false);
          
          // Also check the connection status to make sure it persists
          setTimeout(() => {
            checkConnectionStatus();
          }, 500);
          
          Alert.alert('Success', 'Google Calendar connected successfully!');
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.log('Google auth error received:', event.data.error);
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', messageListener);
          Alert.alert('Error', 'Failed to connect Google Calendar');
          setIsLoading(false);
        }
      };

      window.addEventListener('message', messageListener);

      // Also add a fallback timeout
      setTimeout(() => {
        if (!popup.closed) {
          console.log('OAuth popup still open after 5 minutes, cleaning up listeners');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error('Google Calendar connection error:', error);
      Alert.alert('Error', 'Failed to connect to Google Calendar');
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      console.log('Checking Google Calendar connection status...');
      const status = await ApiService.getGoogleCalendarStatus();
      console.log('Connection status response:', status);
      const connected = status.connected || false;
      console.log('Setting isConnected to:', connected);
      setIsConnected(connected);
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      setIsConnected(false);
    }
  };

  const handleImportAvailability = async () => {
    if (!user || user.id === 'guest') {
      Alert.alert('Error', 'Please log in to import availability');
      return;
    }

    setIsLoading(true);
    try {
      // Import availability from Google Calendar
      const importResponse = await ApiService.importGoogleCalendarAvailability();
      console.log('Import response:', importResponse);
      
      // The response should have availableSlots array
      if (!importResponse || !Array.isArray(importResponse)) {
        Alert.alert('Error', 'Invalid response from Google Calendar import');
        return;
      }

      const validSlots = importResponse.filter((slot: any) => {
        // Check if this slot corresponds to an existing timeslot
        const matchingTimeslot = timeslots.find(timeslot => 
          timeslot.id === slot.timeslotId || 
          timeslot._id === slot.timeslotId ||
          timeslot.id === slot.timeslotId.toString()
        );
        console.log('Checking slot:', slot.timeslotId, 'against timeslots, found match:', !!matchingTimeslot);
        return !!matchingTimeslot;
      });

      console.log('Valid slots found:', validSlots.length, 'out of', importResponse.length);

      if (validSlots.length === 0) {
        Alert.alert(
          'No Matching Timeslots', 
          `No available times from your Google Calendar match the rehearsal timeslots. Found ${importResponse.length} potential slots but none matched existing timeslots.`
        );
        return;
      }

      // Convert to timeslot IDs
      const availableTimeslotIds = validSlots.map((slot: any) => slot.timeslotId);
      console.log('Available timeslot IDs:', availableTimeslotIds);
      
      Alert.alert(
        'Import Successful',
        `Found ${validSlots.length} available timeslots from your Google Calendar. These will be added to your availability.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Confirm',
            onPress: () => {
              onSlotsImported?.(availableTimeslotIds);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Google Calendar import error:', error);
      Alert.alert('Error', 'Failed to import availability from Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkConnectionStatus();
  }, []);

  if (user?.id === 'guest') {
    return null; // Don't show for guest users
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Google Calendar Integration</Text>
      <Text style={styles.description}>
        Connect your Google Calendar to automatically import your availability
      </Text>

      {!isConnected ? (
        <TouchableOpacity
          style={[styles.button, styles.connectButton, isLoading && styles.disabledButton]}
          onPress={handleGoogleConnect}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Connecting...' : 'Connect to Google Calendar'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          <View style={styles.connectedStatus}>
            <Text style={styles.connectedText}>✅ Google Calendar Connected</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.importButton, isLoading && styles.disabledButton]}
            onPress={handleImportAvailability}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Importing...' : 'Import Availability'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  connectButton: {
    backgroundColor: '#4285f4',
  },
  importButton: {
    backgroundColor: '#34a853',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedStatus: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  connectedText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
});
