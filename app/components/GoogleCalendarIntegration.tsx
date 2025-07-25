import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleGoogleConnect = async () => {
    if (!user || user.id === 'guest') {
      setMessageModal({
        title: 'Error',
        message: 'Please log in to connect Google Calendar',
        type: 'error'
      });
      setShowMessageModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Get Google OAuth URL from backend
      const authUrl = await ApiService.getGoogleAuthUrl();
      
      console.log('Redirecting to Google OAuth URL:', authUrl);
      
      // Use redirect for better mobile compatibility (no sessionStorage needed)
      
      // Redirect to Google OAuth
      window.location.href = authUrl;

    } catch (error) {
      console.error('Google Calendar connection error:', error);
      setMessageModal({
        title: 'Error',
        message: 'Failed to connect to Google Calendar',
        type: 'error'
      });
      setShowMessageModal(true);
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

  const handleDisconnect = async () => {
    console.log('🔌 handleDisconnect called');
    console.log('🔌 Current user:', user ? `${user.email} (${user.id})` : 'null');
    console.log('🔌 Is guest?', user?.id === 'guest');
    
    if (!user || user.id === 'guest') {
      setMessageModal({
        title: 'Error',
        message: 'Please log in to disconnect Google Calendar',
        type: 'error'
      });
      setShowMessageModal(true);
      return;
    }

    console.log('🔌 Showing confirmation dialog...');
    setShowDisconnectModal(true);
  };

  const handleConfirmDisconnect = async () => {
    console.log('🔌 Disconnect button pressed, starting disconnect process...');
    setShowDisconnectModal(false);
    setIsLoading(true);
    try {
      console.log('🔌 Calling ApiService.disconnectGoogleCalendar()...');
      const result = await ApiService.disconnectGoogleCalendar();
      console.log('🔌 Disconnect API result:', result);
      setIsConnected(false);
      console.log('🔌 Set isConnected to false, showing success alert');
      setMessageModal({
        title: 'Success',
        message: 'Google Calendar disconnected successfully!',
        type: 'success'
      });
      setShowMessageModal(true);
    } catch (error) {
      console.error('🔌 Google Calendar disconnect error:', error);
      setMessageModal({
        title: 'Error',
        message: `Failed to disconnect Google Calendar: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
      setShowMessageModal(true);
    } finally {
      setIsLoading(false);
      console.log('🔌 Disconnect process completed');
    }
  };

  const handleImportAvailability = async () => {
    if (!user || user.id === 'guest') {
      setMessageModal({
        title: 'Error',
        message: 'Please log in to import availability',
        type: 'error'
      });
      setShowMessageModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Import availability from Google Calendar
      const importResponse = await ApiService.importGoogleCalendarAvailability();
      console.log('Import response:', importResponse);
      
      // The response should have availableSlots array and potentially unavailableSlots
      if (!importResponse || !importResponse.availableSlots || !Array.isArray(importResponse.availableSlots)) {
        setMessageModal({
          title: 'Error',
          message: 'Invalid response from Google Calendar import',
          type: 'error'
        });
        setShowMessageModal(true);
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
        
        setMessageModal({
          title: 'No Available Timeslots',
          message: `No timeslots are available based on your Google Calendar.${conflictMessage}\n\nFound ${busyEventsCount} events in your calendar that conflict with rehearsal times.`,
          type: 'error'
        });
        setShowMessageModal(true);
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
        setMessageModal({
          title: 'Authorization Expired',
          message: 'Your Google Calendar connection has expired. Please reconnect to Google Calendar and try again.',
          type: 'error'
        });
        setShowMessageModal(true);
      } else {
        setMessageModal({
          title: 'Error',
          message: 'Failed to import availability from Google Calendar',
          type: 'error'
        });
        setShowMessageModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkConnectionStatus();
    
    // Check if returning from Google OAuth redirect via URL parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const googleCalendarConnected = urlParams.get('google_calendar_connected');
      const oauthCode = urlParams.get('code');
      const oauthState = urlParams.get('state');
      
      // Handle OAuth callback with authorization code
      if (oauthCode && oauthState) {
        console.log('🔄 Processing Google OAuth callback with code:', oauthCode.length, 'characters');
        
        // Clean up the URL parameters immediately
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
        
        // Exchange the authorization code for tokens
        const handleOAuthCallback = async () => {
          setIsLoading(true);
          try {
            console.log('🔄 Exchanging OAuth code for tokens...');
            const result = await ApiService.exchangeGoogleCode(oauthCode, oauthState);
            console.log('✅ OAuth code exchange successful:', result);
            
            // Update connection status
            setIsConnected(true);
            
            // Show success message
            setMessageModal({
              title: 'Success',
              message: 'Google Calendar connected successfully!',
              type: 'success'
            });
            setShowMessageModal(true);
            
          } catch (error) {
            console.error('❌ OAuth code exchange failed:', error);
            setMessageModal({
              title: 'Error',
              message: `Failed to connect Google Calendar: ${error.message || 'Unknown error'}`,
              type: 'error'
            });
            setShowMessageModal(true);
          } finally {
            setIsLoading(false);
          }
        };
        
        handleOAuthCallback();
      }
      // Legacy support for old callback method
      else if (googleCalendarConnected === 'true') {
        console.log('Returning from Google Calendar OAuth redirect via URL parameter (legacy)');
        
        // Clean up the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);
        
        // Check connection status and show success message
        setTimeout(async () => {
          try {
            const status = await ApiService.getGoogleCalendarStatus();
            const connected = status.connected || false;
            setIsConnected(connected);
            
            if (connected) {
              setMessageModal({
                title: 'Success',
                message: 'Google Calendar connected successfully!',
                type: 'success'
              });
              setShowMessageModal(true);
            }
          } catch (error) {
            console.error('Error checking connection status after redirect:', error);
          }
        }, 1000);
      }
    }
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
          
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton, isLoading && styles.disabledButton]}
            onPress={handleDisconnect}
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
        onRequestClose={() => setShowDisconnectModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Text style={modalStyles.title}>Disconnect Google Calendar</Text>
            <Text style={modalStyles.message}>
              Are you sure you want to disconnect your Google Calendar? You will need to reconnect to use Google Calendar features.
            </Text>
            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.cancelButton]} 
                onPress={() => setShowDisconnectModal(false)}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.confirmButton, { backgroundColor: '#ea4335' }]} 
                onPress={handleConfirmDisconnect}
              >
                <Text style={modalStyles.confirmButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Message Modal (Success/Error) */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Text style={[modalStyles.title, messageModal?.type === 'success' ? { color: '#34a853' } : { color: '#ea4335' }]}>
              {messageModal?.title}
            </Text>
            <Text style={modalStyles.message}>
              {messageModal?.message}
            </Text>
            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.confirmButton, 
                  messageModal?.type === 'success' ? { backgroundColor: '#34a853' } : { backgroundColor: '#ea4335' }
                ]} 
                onPress={() => setShowMessageModal(false)}
              >
                <Text style={modalStyles.confirmButtonText}>OK</Text>
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
    backgroundColor: '#ea4335',
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
