import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { responsive, getScreenSize } from '../utils/responsive';

interface PollResponseViewProps {
  poll: any;
  onResponseSubmitted: () => void;
}

interface ResponseModalProps {
  visible: boolean;
  timeSlot: any;
  currentResponse: string | null;
  allowComments: boolean;
  onSave: (responseType: string, comment: string) => void;
  onCancel: () => void;
}

function ResponseModal({ visible, timeSlot, currentResponse, allowComments, onSave, onCancel }: ResponseModalProps) {
  const [selectedResponse, setSelectedResponse] = useState<string>(currentResponse || '');
  const [comment, setComment] = useState('');

  const screenSize = getScreenSize();
  const responseStyles = createResponseStyles(screenSize);

  useEffect(() => {
    setSelectedResponse(currentResponse || '');
    setComment('');
  }, [visible, currentResponse]);

  const handleSave = () => {
    if (!selectedResponse) {
      Alert.alert('Please select a response');
      return;
    }
    onSave(selectedResponse, comment);
  };

  const responseOptions = [
    { value: 'available', label: '✅ Available', color: '#10b981', description: 'I can definitely attend' },
    { value: 'if-needed', label: '🟡 If Needed', color: '#f59e0b', description: 'I can attend if really needed' },
    { value: 'not-available', label: '❌ Not Available', color: '#ef4444', description: 'I cannot attend' },
  ];

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle={screenSize.isPhone ? "fullScreen" : "pageSheet"}
    >
      <KeyboardAvoidingView 
        style={responseStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={responseStyles.header}>
          <TouchableOpacity onPress={onCancel} style={responseStyles.cancelButton}>
            <Text style={responseStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={responseStyles.title}>Your Response</Text>
          <TouchableOpacity onPress={handleSave} style={responseStyles.saveButton}>
            <Text style={responseStyles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={responseStyles.content}>
          {/* Time Slot Info */}
          <View style={responseStyles.timeSlotInfo}>
            <Text style={responseStyles.timeSlotTitle}>Time Slot</Text>
            <Text style={responseStyles.timeSlotDetails}>
              📅 {timeSlot?.date} at {timeSlot?.startTime} - {timeSlot?.endTime}
            </Text>
            {timeSlot?.description && (
              <Text style={responseStyles.timeSlotDescription}>{timeSlot.description}</Text>
            )}
          </View>

          {/* Response Options */}
          <View style={responseStyles.section}>
            <Text style={responseStyles.sectionTitle}>Select Your Availability</Text>
            {responseOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  responseStyles.responseOption,
                  selectedResponse === option.value && { 
                    backgroundColor: option.color + '20',
                    borderColor: option.color,
                    borderWidth: 2
                  }
                ]}
                onPress={() => setSelectedResponse(option.value)}
              >
                <View style={responseStyles.responseOptionContent}>
                  <Text style={[
                    responseStyles.responseOptionLabel,
                    selectedResponse === option.value && { color: option.color, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={responseStyles.responseOptionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedResponse === option.value && (
                  <View style={[responseStyles.selectedIndicator, { backgroundColor: option.color }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment Section */}
          {allowComments && (
            <View style={responseStyles.section}>
              <Text style={responseStyles.sectionTitle}>Add a Comment (Optional)</Text>
              <TextInput
                style={responseStyles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PollResponseView({ poll, onResponseSubmitted }: PollResponseViewProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  
  const screenSize = getScreenSize();
  const styles = createResponsiveStyles(screenSize);

  useEffect(() => {
    loadPollSummary();
  }, [poll._id]);

  const loadPollSummary = async () => {
    try {
      const summaryData = await ApiService.getPollSummary(poll._id);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading poll summary:', error);
      Alert.alert('Error', 'Failed to load poll data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserResponse = (timeSlotId: string) => {
    return poll.responses?.find((response: any) => 
      response.actorId === (user?.id || user?._id) && response.timeSlotId === timeSlotId
    );
  };

  const handleTimeSlotPress = (timeSlot: any) => {
    setSelectedTimeSlot(timeSlot);
    setResponseModalVisible(true);
  };

  const handleResponseSave = async (responseType: string, comment: string) => {
    try {
      await ApiService.submitPollResponse(poll._id, {
        timeSlotId: selectedTimeSlot.id,
        responseType: responseType as 'available' | 'if-needed' | 'not-available',
        comment
      });

      setResponseModalVisible(false);
      await loadPollSummary();
      onResponseSubmitted();
      
      Alert.alert('Success', 'Your response has been saved');
    } catch (error) {
      console.error('Error saving response:', error);
      Alert.alert('Error', 'Failed to save response');
    }
  };

  const getResponseColor = (responseType: string) => {
    switch (responseType) {
      case 'available': return '#10b981';
      case 'if-needed': return '#f59e0b';
      case 'not-available': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getResponseIcon = (responseType: string) => {
    switch (responseType) {
      case 'available': return '✅';
      case 'if-needed': return '🟡';
      case 'not-available': return '❌';
      default: return '⚪';
    }
  };

  const calculateAvailabilityScore = (timeSlotDetail: any) => {
    const total = timeSlotDetail.availableCount + timeSlotDetail.ifNeededCount + timeSlotDetail.notAvailableCount;
    if (total === 0) return 0;
    
    // Weight: available = 100%, if-needed = 50%, not-available = 0%
    const score = (timeSlotDetail.availableCount * 100 + timeSlotDetail.ifNeededCount * 50) / total;
    return Math.round(score);
  };

  const getAvailabilityColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#84cc16'; // Light green
    if (score >= 40) return '#f59e0b'; // Yellow
    if (score >= 20) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading poll data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Poll Header */}
        <View style={styles.header}>
          <Text style={styles.pollTitle}>{poll.title}</Text>
          {poll.description && (
            <Text style={styles.pollDescription}>{poll.description}</Text>
          )}
          
          {/* Poll Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{summary?.uniqueResponders || 0}</Text>
              <Text style={styles.statLabel}>Responses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{summary?.totalTargetActors || 0}</Text>
              <Text style={styles.statLabel}>Total Actors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(summary?.responseRate || 0)}%</Text>
              <Text style={styles.statLabel}>Response Rate</Text>
            </View>
          </View>
        </View>

        {/* Time Slots with Visual Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Slot Options</Text>
          <Text style={styles.sectionSubtitle}>Tap a time slot to respond</Text>
          
          {summary?.timeSlotDetails?.map((timeSlotDetail: any, index: number) => {
            const userResponse = getCurrentUserResponse(timeSlotDetail.timeSlot.id);
            const availabilityScore = calculateAvailabilityScore(timeSlotDetail);
            const scoreColor = getAvailabilityColor(availabilityScore);
            
            return (
              <TouchableOpacity
                key={timeSlotDetail.timeSlot.id}
                style={[
                  styles.timeSlotCard,
                  userResponse && { borderColor: getResponseColor(userResponse.responseType), borderWidth: 2 }
                ]}
                onPress={() => handleTimeSlotPress(timeSlotDetail.timeSlot)}
              >
                {/* Time Slot Header */}
                <View style={styles.timeSlotHeader}>
                  <View style={styles.timeSlotInfo}>
                    <Text style={styles.timeSlotDate}>📅 {timeSlotDetail.timeSlot.date}</Text>
                    <Text style={styles.timeSlotTime}>
                      🕐 {timeSlotDetail.timeSlot.startTime} - {timeSlotDetail.timeSlot.endTime}
                    </Text>
                    {timeSlotDetail.timeSlot.description && (
                      <Text style={styles.timeSlotDescription}>{timeSlotDetail.timeSlot.description}</Text>
                    )}
                  </View>
                  
                  <View style={styles.availabilityScore}>
                    <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
                      <Text style={styles.scoreText}>{availabilityScore}%</Text>
                    </View>
                    <Text style={styles.scoreLabel}>Available</Text>
                  </View>
                </View>

                {/* Availability Bar */}
                <View style={styles.availabilityBar}>
                  <View 
                    style={[
                      styles.availabilitySegment, 
                      { 
                        flex: timeSlotDetail.availableCount,
                        backgroundColor: '#10b981' 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.availabilitySegment, 
                      { 
                        flex: timeSlotDetail.ifNeededCount,
                        backgroundColor: '#f59e0b' 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.availabilitySegment, 
                      { 
                        flex: timeSlotDetail.notAvailableCount,
                        backgroundColor: '#ef4444' 
                      }
                    ]} 
                  />
                </View>

                {/* Response Counts */}
                <View style={styles.responseCounts}>
                  <View style={styles.responseCount}>
                    <Text style={styles.responseCountNumber}>{timeSlotDetail.availableCount}</Text>
                    <Text style={styles.responseCountLabel}>✅ Available</Text>
                  </View>
                  <View style={styles.responseCount}>
                    <Text style={styles.responseCountNumber}>{timeSlotDetail.ifNeededCount}</Text>
                    <Text style={styles.responseCountLabel}>🟡 If Needed</Text>
                  </View>
                  <View style={styles.responseCount}>
                    <Text style={styles.responseCountNumber}>{timeSlotDetail.notAvailableCount}</Text>
                    <Text style={styles.responseCountLabel}>❌ Not Available</Text>
                  </View>
                </View>

                {/* User's Response */}
                {userResponse && (
                  <View style={styles.userResponse}>
                    <Text style={styles.userResponseLabel}>Your response:</Text>
                    <Text style={[styles.userResponseText, { color: getResponseColor(userResponse.responseType) }]}>
                      {getResponseIcon(userResponse.responseType)} {userResponse.responseType.replace('-', ' ').toUpperCase()}
                    </Text>
                    {userResponse.comment && (
                      <Text style={styles.userResponseComment}>"{userResponse.comment}"</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scenes */}
        {poll.scenes && poll.scenes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Scenes</Text>
            <View style={styles.scenesList}>
              {poll.scenes.map((scene: string, index: number) => (
                <View key={index} style={styles.sceneTag}>
                  <Text style={styles.sceneText}>{scene}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Response Modal */}
      <ResponseModal
        visible={responseModalVisible}
        timeSlot={selectedTimeSlot}
        currentResponse={selectedTimeSlot ? getCurrentUserResponse(selectedTimeSlot.id)?.responseType : null}
        allowComments={poll.settings?.allowComments || false}
        onSave={handleResponseSave}
        onCancel={() => setResponseModalVisible(false)}
      />
    </View>
  );
}

const createResponsiveStyles = (screenSize: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    loadingText: {
      textAlign: 'center',
      fontSize: responsive.fontSize.md,
      color: '#64748b',
      marginTop: 50,
    },
    header: {
      backgroundColor: '#ffffff',
      padding: responsive.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    pollTitle: {
      fontSize: screenSize.isPhone ? responsive.fontSize.xl : responsive.fontSize.xxl,
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: responsive.spacing.sm,
      lineHeight: screenSize.isPhone ? 24 : 32,
    },
    pollDescription: {
      fontSize: responsive.fontSize.md,
      color: '#64748b',
      lineHeight: screenSize.isPhone ? 20 : 24,
      marginBottom: responsive.spacing.md,
    },
    statsContainer: {
      flexDirection: screenSize.isPhone ? 'row' : 'row',
      justifyContent: 'space-around',
      paddingTop: responsive.spacing.md,
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      flexWrap: screenSize.isPhone ? 'wrap' : 'nowrap',
    },
    statItem: {
      alignItems: 'center',
      minWidth: screenSize.isPhone ? '30%' : 'auto',
      marginBottom: screenSize.isPhone ? responsive.spacing.sm : 0,
    },
    statNumber: {
      fontSize: screenSize.isPhone ? responsive.fontSize.lg : responsive.fontSize.xxl,
      fontWeight: '700',
      color: '#3b82f6',
    },
    statLabel: {
      fontSize: responsive.fontSize.xs,
      color: '#64748b',
      marginTop: responsive.spacing.xs / 2,
      textAlign: 'center',
    },
    section: {
      padding: responsive.spacing.md,
    },
    sectionTitle: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: responsive.spacing.xs / 2,
    },
    sectionSubtitle: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      marginBottom: responsive.spacing.md,
    },
    timeSlotCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: responsive.spacing.md,
      marginBottom: responsive.spacing.md,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    timeSlotHeader: {
      flexDirection: screenSize.isPhone ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: screenSize.isPhone ? 'stretch' : 'flex-start',
      marginBottom: responsive.spacing.sm,
    },
    timeSlotInfo: {
      flex: 1,
      marginBottom: screenSize.isPhone ? responsive.spacing.sm : 0,
    },
    timeSlotDate: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: responsive.spacing.xs / 2,
    },
    timeSlotTime: {
      fontSize: responsive.fontSize.md,
      color: '#3b82f6',
      fontWeight: '500',
      marginBottom: responsive.spacing.xs / 2,
    },
    timeSlotDescription: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      fontStyle: 'italic',
    },
    availabilityScore: {
      alignItems: 'center',
      alignSelf: screenSize.isPhone ? 'center' : 'flex-start',
    },
    scoreCircle: {
      width: screenSize.isPhone ? 40 : 50,
      height: screenSize.isPhone ? 40 : 50,
      borderRadius: screenSize.isPhone ? 20 : 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.spacing.xs / 2,
    },
    scoreText: {
      fontSize: responsive.fontSize.xs,
      fontWeight: '700',
      color: '#ffffff',
    },
    scoreLabel: {
      fontSize: responsive.fontSize.xs - 1,
      color: '#64748b',
      textAlign: 'center',
    },
    availabilityBar: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      backgroundColor: '#f1f5f9',
      overflow: 'hidden',
      marginBottom: responsive.spacing.sm,
    },
    availabilitySegment: {
      height: '100%',
    },
    responseCounts: {
      flexDirection: screenSize.isPhone ? 'column' : 'row',
      justifyContent: 'space-around',
      paddingVertical: responsive.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      gap: screenSize.isPhone ? responsive.spacing.xs : 0,
    },
    responseCount: {
      alignItems: 'center',
      flexDirection: screenSize.isPhone ? 'row' : 'column',
      justifyContent: screenSize.isPhone ? 'space-between' : 'center',
      paddingHorizontal: screenSize.isPhone ? responsive.spacing.sm : 0,
    },
    responseCountNumber: {
      fontSize: screenSize.isPhone ? responsive.fontSize.md : responsive.fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
    },
    responseCountLabel: {
      fontSize: responsive.fontSize.xs,
      color: '#64748b',
      marginTop: screenSize.isPhone ? 0 : responsive.spacing.xs / 2,
      marginLeft: screenSize.isPhone ? responsive.spacing.sm : 0,
    },
    userResponse: {
      marginTop: responsive.spacing.sm,
      padding: responsive.spacing.sm,
      backgroundColor: '#f8fafc',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#3b82f6',
    },
    userResponseLabel: {
      fontSize: responsive.fontSize.xs,
      color: '#64748b',
      fontWeight: '500',
      marginBottom: responsive.spacing.xs / 2,
    },
    userResponseText: {
      fontSize: responsive.fontSize.sm,
      fontWeight: '600',
      marginBottom: responsive.spacing.xs / 2,
    },
    userResponseComment: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      fontStyle: 'italic',
    },
    scenesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.spacing.xs,
    },
    sceneTag: {
      backgroundColor: '#eff6ff',
      borderColor: '#dbeafe',
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.xs,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sceneText: {
      fontSize: responsive.fontSize.sm,
      color: '#1d4ed8',
      fontWeight: '500',
      textAlign: 'center',
    },
  });
};

const createResponseStyles = (screenSize: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.md,
      paddingTop: screenSize.isPhone ? 60 : 40,
      paddingBottom: responsive.spacing.md,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      minHeight: responsive.touchTarget.large,
    },
    title: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
    },
    cancelButton: {
      paddingVertical: responsive.spacing.sm,
      paddingHorizontal: responsive.spacing.sm,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: responsive.fontSize.md,
      color: '#64748b',
    },
    saveButton: {
      paddingVertical: responsive.spacing.sm,
      paddingHorizontal: responsive.spacing.sm,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      minHeight: responsive.touchTarget.small,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: responsive.fontSize.md,
      color: '#ffffff',
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: responsive.spacing.md,
    },
    timeSlotInfo: {
      backgroundColor: '#ffffff',
      padding: responsive.spacing.md,
      borderRadius: 12,
      marginTop: responsive.spacing.md,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    timeSlotTitle: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: responsive.spacing.sm,
    },
    timeSlotDetails: {
      fontSize: responsive.fontSize.md,
      color: '#3b82f6',
      fontWeight: '500',
      marginBottom: responsive.spacing.xs / 2,
    },
    timeSlotDescription: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      fontStyle: 'italic',
    },
    section: {
      marginTop: responsive.spacing.lg,
    },
    sectionTitle: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: responsive.spacing.md,
    },
    responseOption: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 12,
      padding: responsive.spacing.md,
      marginBottom: responsive.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: responsive.touchTarget.large,
    },
    responseOptionContent: {
      flex: 1,
    },
    responseOptionLabel: {
      fontSize: responsive.fontSize.md,
      fontWeight: '500',
      color: '#1e293b',
      marginBottom: responsive.spacing.xs / 2,
    },
    responseOptionDescription: {
      fontSize: responsive.fontSize.sm,
      color: '#64748b',
      lineHeight: screenSize.isPhone ? 18 : 20,
    },
    selectedIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      paddingHorizontal: responsive.spacing.sm,
      paddingVertical: responsive.spacing.sm,
      fontSize: responsive.fontSize.md,
      backgroundColor: '#ffffff',
      minHeight: screenSize.isPhone ? 80 : 100,
      textAlignVertical: 'top',
    },
  });
};