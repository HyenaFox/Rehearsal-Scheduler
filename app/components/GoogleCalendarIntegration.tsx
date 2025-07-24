import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface GoogleCalendarIntegrationProps {
  onSlotsImported?: (slots: string[]) => void;
}

export default function GoogleCalendarIntegration({ onSlotsImported }: GoogleCalendarIntegrationProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    slots: string[];
    validCount: number;
    conflictCount: number;
    busyEventsCount: number;
  } | null>(null);

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
      const status = await ApiService.getGoogleCalendarStatus();
      const connected = status.connected || false;
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
      
      // The response should have availableSlots array and potentially unavailableSlots
      if (!importResponse || !importResponse.availableSlots || !Array.isArray(importResponse.availableSlots)) {
        Alert.alert('Error', 'Invalid response from Google Calendar import');
        return;
      }

      const availableSlots = importResponse.availableSlots || [];
      const unavailableSlots = importResponse.unavailableSlots || [];
      const totalTimeslots = importResponse.totalTimeslots || 0;
      const busyEventsCount = importResponse.busyEventsCount || 0;

      console.log('Import response details:', {
        availableSlots: availableSlots.length,
        unavailableSlots: unavailableSlots.length,
        totalTimeslots,
        busyEventsCount
      });

      // Since the backend now only returns actual timeslots that exist in the database,
      // we don't need to do additional frontend validation
      const validSlots = availableSlots;
      console.log('Valid slots found:', validSlots.length, 'out of', totalTimeslots, 'total timeslots');

      if (validSlots.length === 0) {
        const conflictMessage = unavailableSlots.length > 0 
          ? `\n\n${unavailableSlots.length} timeslots have conflicts with your Google Calendar events.`
          : '';
        
        Alert.alert(
          'No Available Timeslots', 
          `No timeslots are available based on your Google Calendar.${conflictMessage}\n\nFound ${busyEventsCount} events in your calendar that conflict with rehearsal times.`
        );
        return;
      }

      // Convert to ISO date strings (same format as manual selection)
      const availableTimeslots = validSlots.map((slot: any) => slot.date);
      
      // Set up the pending import data and show modal
      setPendingImport({
        slots: availableTimeslots,
        validCount: validSlots.length,
        conflictCount: unavailableSlots.length,
        busyEventsCount
      });
      setShowConfirmModal(true);

    } catch (error: any) {
      console.error('Google Calendar import error:', error);
      
      // Handle expired/invalid Google tokens
      if (error.response && error.response.status === 401) {
        console.log('Google Calendar authorization expired, resetting connection status');
        setIsConnected(false);
        Alert.alert(
          'Authorization Expired', 
          'Your Google Calendar connection has expired. Please reconnect to Google Calendar and try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally automatically trigger reconnection
                // handleGoogleConnect();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to import availability from Google Calendar');
      }
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Handler functions for the modal
  const handleConfirmImport = () => {
    if (pendingImport) {
      onSlotsImported?.(pendingImport.slots);
    }
    setShowConfirmModal(false);
    setPendingImport(null);
  };

  const handleCancelImport = () => {
    setShowConfirmModal(false);
    setPendingImport(null);
  };

  if (user?.id === 'guest') {
    return null; // Don't show for guest users
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Google Calendar Integration</Text>
      <Text style={styles.description}>
        Connect your Google Calendar to automatically identify which rehearsal timeslots are available based on your existing calendar events. Timeslots will be marked as available only if you have no conflicting events.
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
              {isLoading ? 'Analyzing Calendar...' : 'Check Availability'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelImport}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Text style={modalStyles.title}>Confirm Import</Text>
            <Text style={modalStyles.message}>
              {pendingImport && (
                <>
                  Found {pendingImport.validCount} available timeslots from your Google Calendar analysis.
                  {pendingImport.conflictCount > 0 && (
                    <>
                      {'\n\n'}{pendingImport.conflictCount} other timeslots have conflicts with your calendar.
                    </>
                  )}
                  {'\n\n'}Analyzed {pendingImport.busyEventsCount} calendar events.
                  {'\n\n'}Would you like to mark these timeslots as available in your profile?
                </>
              )}
            </Text>
            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton]} onPress={handleCancelImport}>
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.button, modalStyles.confirmButton]} onPress={handleConfirmImport}>
                <Text style={modalStyles.confirmButtonText}>Import Timeslots</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#34a853',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
