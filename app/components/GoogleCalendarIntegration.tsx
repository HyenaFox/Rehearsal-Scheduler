import { useEffect, useState } from 'react';
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
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    slots: string[];
    validCount: number;
    conflictCount: number;
    busyEventsCount: number;
  } | null>(null);

  // Check connection status and handle OAuth callback result on mount
  useEffect(() => {
    const checkOAuthCallback = () => {
      try {
        const storedState = sessionStorage.getItem('oauth_state');
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          
          // If this is a Google Calendar OAuth action and it's recent (within 5 minutes)
          if (parsedState.action === 'google_calendar_connect' && 
              Date.now() - parsedState.timestamp < 300000) {
            
            console.log('📅 Detected return from Google Calendar OAuth');
            
            // Clear the stored state
            sessionStorage.removeItem('oauth_state');
            
            // Check connection status to confirm it worked
            setTimeout(() => {
              checkConnectionStatus();
            }, 1000);
            
            // Show success message
            Alert.alert('Success', 'Google Calendar connected successfully!');
          }
        }
      } catch (error) {
        console.error('Error checking OAuth callback:', error);
      }
    };

    checkConnectionStatus();
    checkOAuthCallback();
  }, [user]);

  const handleGoogleConnect = async () => {
    if (!user || user.id === 'guest') {
      Alert.alert('Error', 'Please log in to connect Google Calendar');
      return;
    }

    setIsLoading(true);
    try {
      // Get Google OAuth URL from backend
      const authUrl = await ApiService.getGoogleAuthUrl();
      
      console.log('📅 Redirecting to Google OAuth (universal mobile/desktop solution):', authUrl);
      
      // Store the current app state to restore after OAuth
      const currentState = {
        returnUrl: window.location.pathname,
        timestamp: Date.now(),
        action: 'google_calendar_connect'
      };
      
      // Store state in sessionStorage for retrieval after redirect
      sessionStorage.setItem('oauth_state', JSON.stringify(currentState));
      
      // Redirect to Google OAuth (works universally on all browsers)
      // This replaces the popup approach which doesn't work reliably on mobile
      window.location.href = authUrl;

    } catch (error) {
      console.error('Google Calendar connection error:', error);
      Alert.alert('Error', 'Failed to connect to Google Calendar');
      setIsLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    console.log('🔴 Disconnect button clicked');
    setShowDisconnectModal(true);
  };

  const handleConfirmDisconnect = async () => {
    console.log('🔴 Starting disconnect process...');
    setShowDisconnectModal(false);
    setIsLoading(true);
    try {
      console.log('🔴 Calling ApiService.disconnectGoogleCalendar()...');
      const result = await ApiService.disconnectGoogleCalendar();
      console.log('🔴 Disconnect result:', result);
      setIsConnected(false);
      Alert.alert('Success', 'Google Calendar disconnected successfully');
      console.log('🔴 Disconnect completed successfully');
    } catch (error) {
      console.error('🔴 Error disconnecting Google Calendar:', error);
      Alert.alert('Error', 'Failed to disconnect Google Calendar');
    } finally {
      console.log('🔴 Disconnect process finished, setting loading to false');
      setIsLoading(false);
    }
  };

  const handleCancelDisconnect = () => {
    console.log('🔴 Disconnect cancelled');
    setShowDisconnectModal(false);
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

      // THE FIX: The backend now sends simple strings. The response is already in the correct format.
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
      
      // Set up the pending import data and show modal
      setPendingImport({
        slots: validSlots, // Pass the simple strings directly
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

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton, isLoading && styles.disabledButton]}
            onPress={handleGoogleDisconnect}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              Disconnect Google Calendar
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

      {/* Disconnect Confirmation Modal */}
      <Modal
        visible={showDisconnectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDisconnect}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Text style={modalStyles.title}>Disconnect Google Calendar</Text>
            <Text style={modalStyles.message}>
              Are you sure you want to disconnect your Google Calendar? This will remove access to your calendar data.
            </Text>
            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton]} onPress={handleCancelDisconnect}>
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.button, modalStyles.disconnectModalButton]} onPress={handleConfirmDisconnect}>
                <Text style={modalStyles.disconnectButtonText}>Disconnect</Text>
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
  disconnectButton: {
    backgroundColor: '#dc3545',
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
  disconnectModalButton: {
    backgroundColor: '#dc3545',
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
  disconnectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
