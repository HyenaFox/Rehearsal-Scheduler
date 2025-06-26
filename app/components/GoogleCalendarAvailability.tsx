import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import ApiService from '../services/api';

interface TimeslotAvailability {
  id: string;
  label: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  availability: number; // 0-1 representing percentage available
  totalDays: number;
  totalAvailableDays: number;
  conflicts: {
    date: string;
    conflictingEvents: {
      summary: string;
      start: string;
      end: string;
    }[];
  }[];
  nextAvailableDate?: string;
}

interface GoogleCalendarStatus {
  isConnected: boolean;
  googleEmail?: string;
  hasAvailableSlots: boolean;
}

const GoogleCalendarAvailability: React.FC = () => {
  const { timeslots } = useApp();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [availability, setAvailability] = useState<TimeslotAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkCalendarStatus();
  }, []);

  const checkCalendarStatus = async () => {
    try {
      const calendarStatus = await ApiService.getGoogleCalendarStatus();
      setStatus(calendarStatus);
    } catch (error) {
      console.error('Failed to get calendar status:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      await ApiService.getGoogleAuthUrl();
      
      // In a real app, you would open this URL in a browser/WebView
      Alert.alert(
        'Google Calendar Setup',
        'In a production app, this would open Google OAuth in a browser. For now, this is just a demo of the availability checking feature.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start Google Calendar connection');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTimeslotAvailability = async () => {
    if (!status?.isConnected) {
      Alert.alert('Not Connected', 'Please connect your Google Calendar first');
      return;
    }

    try {
      setChecking(true);
      const result = await ApiService.checkTimeslotsAvailability(timeslots, 30);
      
      setAvailability(result.timeslots);
      
      Alert.alert(
        'Availability Updated!',
        `Found ${result.totalEvents} calendar events. ${result.availableTimeslotIds.length}/${timeslots.length} timeslots are available.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check timeslot availability against your calendar');
      console.error('Availability check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const renderAvailabilityStatus = (timeslot: TimeslotAvailability) => {
    const availabilityPercent = Math.round(timeslot.availability * 100);
    const statusColor = timeslot.isAvailable ? '#4CAF50' : '#F44336';
    const statusText = timeslot.isAvailable ? 'Available' : 'Conflicts';

    return (
      <View style={{ 
        backgroundColor: 'white', 
        margin: 8, 
        padding: 16, 
        borderRadius: 8, 
        borderLeftWidth: 4,
        borderLeftColor: statusColor
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{timeslot.label}</Text>
          <Text style={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</Text>
        </View>
        
        <Text style={{ marginTop: 8, color: '#666' }}>
          Available {timeslot.totalAvailableDays}/{timeslot.totalDays} days ({availabilityPercent}%)
        </Text>
        
        {timeslot.conflicts.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#F44336' }}>Conflicts:</Text>
            {timeslot.conflicts.slice(0, 2).map((conflict, index) => (
              <Text key={index} style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                • {conflict.date}: {conflict.conflictingEvents.map(e => e.summary).join(', ')}
              </Text>
            ))}
            {timeslot.conflicts.length > 2 && (
              <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                ... and {timeslot.conflicts.length - 2} more conflicts
              </Text>
            )}
          </View>
        )}
        
        {timeslot.nextAvailableDate && !timeslot.isAvailable && (
          <Text style={{ marginTop: 8, color: '#4CAF50', fontSize: 12 }}>
            Next available: {timeslot.nextAvailableDate}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Google Calendar Integration
        </Text>
        
        {/* Connection Status */}
        <View style={{ 
          backgroundColor: 'white', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Calendar Status
          </Text>
          
          {status ? (
            <View>
              <Text style={{ 
                color: status.isConnected ? '#4CAF50' : '#F44336',
                fontWeight: 'bold' 
              }}>
                {status.isConnected ? '✅ Connected' : '❌ Not Connected'}
              </Text>
              
              {status.isConnected && status.googleEmail && (
                <Text style={{ color: '#666', marginTop: 4 }}>
                  Account: {status.googleEmail}
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ color: '#666' }}>Checking status...</Text>
          )}
        </View>

        {/* Connection Button */}
        {!status?.isConnected && (
          <TouchableOpacity
            style={{
              backgroundColor: '#4285F4',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 16
            }}
            onPress={connectGoogleCalendar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                Connect Google Calendar
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Check Availability Button */}
        {status?.isConnected && (
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 16
            }}
            onPress={checkTimeslotAvailability}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                Check All Timeslots Against Calendar
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Availability Results */}
        {availability.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Timeslot Availability Analysis
            </Text>
            
            <Text style={{ color: '#666', marginBottom: 16 }}>
              Based on your Google Calendar events, here&apos;s your availability for each rehearsal timeslot:
            </Text>
            
            {availability.map((timeslot) => renderAvailabilityStatus(timeslot))}
          </View>
        )}

        {/* Instructions */}
        <View style={{ 
          backgroundColor: '#E3F2FD', 
          padding: 16, 
          borderRadius: 8, 
          marginTop: 16 
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            How It Works:
          </Text>
          
          <Text style={{ color: '#666', lineHeight: 20 }}>
            1. Connect your Google Calendar to allow the app to read your events{'\n'}
            2. Click &quot;Check All Timeslots&quot; to analyze your availability{'\n'}
            3. The app checks each rehearsal timeslot against your calendar events{'\n'}
            4. You&apos;re marked as &quot;Available&quot; if more than 50% of occurrences are free{'\n'}
            5. Your profile is automatically updated with your availability{'\n'}
            6. Directors can see who&apos;s truly available for each timeslot
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default GoogleCalendarAvailability;
