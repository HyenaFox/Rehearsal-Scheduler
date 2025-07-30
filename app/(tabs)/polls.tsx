import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import ActionButton from '../components/ActionButton';
import CreatePollModal from '../components/CreatePollModal';
import PollResponseView from '../components/PollResponseView';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';

export default function PollsScreen() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPollModalVisible, setCreatePollModalVisible] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [pollViewModalVisible, setPollViewModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'my-responses' | 'created-by-me'>('all');

  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const pollsData = await ApiService.getPolls();
      setPolls(pollsData);
    } catch (error) {
      console.error('Error loading polls:', error);
      Alert.alert('Error', 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (pollData: any) => {
    try {
      await ApiService.createPoll(pollData);
      setCreatePollModalVisible(false);
      await loadPolls();
      Alert.alert('Success', 'Poll created successfully');
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  };

  const handleViewPoll = (poll: any) => {
    setSelectedPoll(poll);
    setPollViewModalVisible(true);
  };

  const handleDuplicatePoll = async (poll: any) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can duplicate polls.');
      return;
    }

    try {
      await ApiService.duplicatePoll(poll._id, {
        title: `${poll.title} (Copy)`
      });
      await loadPolls();
      Alert.alert('Success', 'Poll duplicated successfully');
    } catch (error) {
      console.error('Error duplicating poll:', error);
      Alert.alert('Error', 'Failed to duplicate poll');
    }
  };

  const handleDeletePoll = (poll: any) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can delete polls.');
      return;
    }

    setPollToDelete(poll);
    setDeleteModalVisible(true);
  };

  const confirmDeletePoll = async () => {
    if (!pollToDelete) return;
    
    setIsDeleting(true);
    try {
      await ApiService.deletePoll(pollToDelete._id);
      await loadPolls();
      setDeleteModalVisible(false);
      setPollToDelete(null);
      console.log('Poll deleted successfully');
    } catch (error) {
      console.error('Error deleting poll:', error);
      Alert.alert('Error', 'Failed to delete poll');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeletePoll = () => {
    setDeleteModalVisible(false);
    setPollToDelete(null);
  };

  const handleExportPoll = async (poll: any) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can export poll data.');
      return;
    }

    try {
      const blob = await ApiService.exportPollCSV(poll._id);
      
      // For web, create download link
      if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `poll-${poll._id}-responses.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        Alert.alert('Success', 'Poll data exported successfully');
      } else {
        Alert.alert('Info', 'CSV export is currently only available on web');
      }
    } catch (error) {
      console.error('Error exporting poll:', error);
      Alert.alert('Error', 'Failed to export poll data');
    }
  };

  const getFilteredPolls = () => {
    switch (viewMode) {
      case 'my-responses':
        return polls.filter(poll => 
          poll.targetActors?.some((target: any) => target.actorId === (user?.id || user?._id))
        );
      case 'created-by-me':
        return polls.filter(poll => poll.createdBy === (user?.id || user?._id));
      default:
        return polls;
    }
  };

  const getUserResponseStatus = (poll: any) => {
    const userResponses = poll.responses?.filter((response: any) => 
      response.actorId === (user?.id || user?._id)
    );
    
    // For new dateRanges format, count total date ranges
    const totalRanges = poll.dateRanges?.length || poll.timeSlots?.length || 0;
    
    if (!userResponses || userResponses.length === 0) {
      return { status: 'pending', count: 0, total: totalRanges };
    }
    
    return { 
      status: 'responded', 
      count: userResponses.length, 
      total: totalRanges 
    };
  };

  const getPollStatusColor = (poll: any) => {
    switch (poll.status) {
      case 'active': return '#10b981';
      case 'draft': return '#64748b';
      case 'closed': return '#ef4444';
      case 'scheduled': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getPollStatusIcon = (poll: any) => {
    switch (poll.status) {
      case 'active': return '🟢';
      case 'draft': return '📝';
      case 'closed': return '🔴';
      case 'scheduled': return '📅';
      default: return '⚪';
    }
  };

  const PollCard = ({ poll }: { poll: any }) => {
    const responseStatus = getUserResponseStatus(poll);
    const isTargetActor = poll.targetActors?.some((target: any) => target.actorId === (user?.id || user?._id));
    
    return (
      <View style={styles.pollCard}>
        <View style={styles.pollHeader}>
          <View style={styles.pollTitleContainer}>
            <Text style={styles.pollTitle}>{poll.title}</Text>
            <View style={styles.pollMeta}>
              <Text style={[styles.pollStatus, { color: getPollStatusColor(poll) }]}>
                {getPollStatusIcon(poll)} {poll.status.toUpperCase()}
              </Text>
              <Text style={styles.pollDate}>
                Created {new Date(poll.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {poll.description && (
          <Text style={styles.pollDescription} numberOfLines={2}>
            {poll.description}
          </Text>
        )}

        {/* Poll Stats */}
        <View style={styles.pollStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{poll.dateRanges?.length || poll.timeSlots?.length || 0}</Text>
            <Text style={styles.statLabel}>{poll.dateRanges ? 'Date Ranges' : 'Time Slots'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{poll.targetActors?.length || 0}</Text>
            <Text style={styles.statLabel}>Target Actors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{poll.summary?.uniqueResponders || 0}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(poll.summary?.responseRate || 0)}%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>

        {/* User Response Status */}
        {isTargetActor && (
          <View style={styles.responseStatus}>
            <Text style={styles.responseStatusLabel}>Your status:</Text>
            <Text style={[
              styles.responseStatusText,
              { color: responseStatus.status === 'responded' ? '#10b981' : '#f59e0b' }
            ]}>
              {responseStatus.status === 'responded' 
                ? `✅ Responded (${responseStatus.count}/${responseStatus.total} ${poll.dateRanges ? 'ranges' : 'slots'})`
                : '⏳ Pending response'
              }
            </Text>
          </View>
        )}

        {/* Related Scenes */}
        {poll.scenes && poll.scenes.length > 0 && (
          <View style={styles.scenesContainer}>
            <Text style={styles.scenesLabel}>Scenes:</Text>
            <View style={styles.scenesList}>
              {poll.scenes.slice(0, 3).map((scene: string, index: number) => (
                <View key={index} style={styles.sceneTag}>
                  <Text style={styles.sceneText}>{scene}</Text>
                </View>
              ))}
              {poll.scenes.length > 3 && (
                <Text style={styles.moreScenes}>+{poll.scenes.length - 3} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewPoll(poll)}
          >
            <Text style={styles.viewButtonText}>
              {isTargetActor ? '📝 Respond' : '👁️ View'}
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <View style={styles.adminButtons}>
              <TouchableOpacity
                style={styles.duplicateButton}
                onPress={() => handleDuplicatePoll(poll)}
              >
                <Text style={styles.duplicateButtonText}>📋 Duplicate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => handleExportPoll(poll)}
              >
                <Text style={styles.exportButtonText}>📊 Export</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePoll(poll)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const filteredPolls = getFilteredPolls();

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={commonStyles.contentContainer}>
        <View style={commonStyles.headerSection}>
          <View style={commonStyles.screenTitleContainer}>
            <Text style={commonStyles.screenTitle}>🗳️ Polls</Text>
          </View>
          <Text style={commonStyles.subtitle}>
            Group availability polling and scheduling coordination
          </Text>

          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'all' && styles.activeToggle]}
              onPress={() => setViewMode('all')}
            >
              <Text style={[styles.toggleText, viewMode === 'all' && styles.activeToggleText]}>
                📋 All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'my-responses' && styles.activeToggle]}
              onPress={() => setViewMode('my-responses')}
            >
              <Text style={[styles.toggleText, viewMode === 'my-responses' && styles.activeToggleText]}>
                📝 My Responses
              </Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'created-by-me' && styles.activeToggle]}
                onPress={() => setViewMode('created-by-me')}
              >
                <Text style={[styles.toggleText, viewMode === 'created-by-me' && styles.activeToggleText]}>
                  👤 My Polls
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Create Poll Button */}
          {isAdmin && (
            <View style={styles.createButtonContainer}>
              <ActionButton
                title="➕ Create Poll"
                onPress={() => setCreatePollModalVisible(true)}
                style={styles.createButton}
              />
            </View>
          )}
        </View>

        <ScrollView
          style={commonStyles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={commonStyles.emptyState}>
              <Text style={commonStyles.emptyStateText}>Loading polls...</Text>
            </View>
          ) : filteredPolls.length === 0 ? (
            <View style={commonStyles.emptyState}>
              <Text style={styles.emptyIcon}>
                {viewMode === 'all' ? '🗳️' : viewMode === 'my-responses' ? '📝' : '👤'}
              </Text>
              <Text style={commonStyles.emptyStateText}>
                {viewMode === 'all' 
                  ? 'No polls found' 
                  : viewMode === 'my-responses'
                  ? 'No polls requiring your response'
                  : 'No polls created by you'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                {viewMode === 'all' && isAdmin
                  ? 'Create your first poll to coordinate rehearsal scheduling with your cast.'
                  : viewMode === 'all' && !isAdmin
                  ? 'When administrators create polls, they\'ll appear here for you to respond to.'
                  : viewMode === 'my-responses'
                  ? 'When you\'re selected for a poll, it will appear here for you to indicate your availability.'
                  : 'Use the "Create Poll" button above to start coordinating schedules with your actors.'
                }
              </Text>
            </View>
          ) : (
            filteredPolls.map((poll) => (
              <PollCard key={poll._id} poll={poll} />
            ))
          )}
        </ScrollView>
      </View>

      {/* Create Poll Modal */}
      <CreatePollModal
        visible={createPollModalVisible}
        onSave={handleCreatePoll}
        onCancel={() => setCreatePollModalVisible(false)}
      />

      {/* Poll View Modal */}
      <Modal 
        visible={pollViewModalVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setPollViewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setPollViewModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Poll Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          {selectedPoll && (
            <PollResponseView
              poll={selectedPoll}
              onResponseSubmitted={() => {
                loadPolls();
                setPollViewModalVisible(false);
              }}
            />
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        visible={deleteModalVisible} 
        animationType="fade" 
        transparent={true}
        onRequestClose={cancelDeletePoll}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Text style={styles.deleteModalIcon}>🗑️</Text>
              <Text style={styles.deleteModalTitle}>Delete Poll</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{pollToDelete?.title}"?
            </Text>
            <Text style={styles.deleteModalWarning}>
              This action cannot be undone and will permanently remove all poll data and responses.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.cancelDeleteButton}
                onPress={cancelDeletePoll}
              >
                <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmDeleteButton, isDeleting && styles.confirmDeleteButtonDisabled]}
                onPress={confirmDeletePoll}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {isDeleting ? 'Deleting...' : 'Delete Poll'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeToggleText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  createButtonContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  pollCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pollTitleContainer: {
    flex: 1,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  pollMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pollStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  pollDate: {
    fontSize: 12,
    color: '#64748b',
  },
  pollDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  pollStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  responseStatus: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseStatusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  responseStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scenesContainer: {
    marginBottom: 12,
  },
  scenesLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 6,
  },
  scenesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  sceneTag: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sceneText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  moreScenes: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  duplicateButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  duplicateButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  exportButton: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  exportButtonText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 60, // Balance the close button
  },
  emptyIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmDeleteButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
});