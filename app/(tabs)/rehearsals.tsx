import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActorEditModal from '../components/ActorEditModal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';

export default function ActorsScreen() {
  const { actors, setActors, scenes } = useApp();
  const { user } = useAuth();
  
  // Admin check
  const isAdmin = user?.isAdmin || false;
  
  // Modal states
  const [actorEditModalVisible, setActorEditModalVisible] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);

  // Get scenes for an actor
  const getActorScenes = (actor: any) => {
    if (!actor.scenes || !scenes) return [];
    return scenes.filter(scene => 
      actor.scenes.includes(scene.id || scene._id)
    );
  };

  const handleEditActor = (actor: any) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can edit actors.');
      return;
    }
    setSelectedActor(actor);
    setActorEditModalVisible(true);
  };

  const handleSaveActor = async (editedActor: any) => {
    try {
      console.log('🔄 Saving actor to backend:', editedActor);
      
      if (!editedActor.id) {
        console.error('❌ Actor ID is missing, cannot update');
        Alert.alert('Error', 'Actor ID is missing, cannot update');
        return;
      }
      
      // Update actor in backend
      await ApiService.updateActor(editedActor.id, {
        name: editedActor.name,
        availableTimeslots: editedActor.availableTimeslots,
        scenes: editedActor.scenes
      });
      
      // Update local state
      const updatedActors = actors.map(actor => 
        actor.id === editedActor.id ? editedActor : actor
      );
      setActors(updatedActors);
      setActorEditModalVisible(false);
      setSelectedActor(null);
      
      console.log('✅ Actor updated successfully');
    } catch (error) {
      console.error('❌ Error updating actor:', error);
      Alert.alert('Error', 'Failed to update actor');
    }
  };

  const handleCancelActorEdit = () => {
    setActorEditModalVisible(false);
    setSelectedActor(null);
  };

  const ActorCard = ({ actor }: { actor: any }) => {
    const actorScenes = getActorScenes(actor);
    
    return (
      <View style={styles.actorCard}>
        <View style={styles.actorHeader}>
          <Text style={styles.actorName}>🎭 {actor.name}</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => handleEditActor(actor)}
            >
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.actorDetails}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Scenes:</Text>
            {actorScenes.length > 0 ? (
              <View style={styles.scenesList}>
                {actorScenes.map((scene, index) => (
                  <View key={scene.id || scene._id} style={styles.sceneTag}>
                    <Text style={styles.sceneText}>{scene.title}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No scenes assigned</Text>
            )}
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[styles.statusBadge, actorScenes.length > 0 ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={[styles.statusText, actorScenes.length > 0 ? styles.activeText : styles.inactiveText]}>
                {actorScenes.length > 0 ? `Active in ${actorScenes.length} scene${actorScenes.length > 1 ? 's' : ''}` : 'Not assigned'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={commonStyles.contentContainer}>
        <View style={commonStyles.headerSection}>
          <View style={commonStyles.screenTitleContainer}>
            <Text style={commonStyles.screenTitle}>🎭 Actors</Text>
            <Text style={styles.subtitle}>View all actors and their scene assignments</Text>
          </View>
        </View>
        
        <ScrollView 
          style={commonStyles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {actors.length === 0 ? (
            <View style={commonStyles.emptyState}>
              <Text style={commonStyles.emptyStateText}>
                No actors found.
              </Text>
              <Text style={styles.emptySubtext}>
                Actors are automatically added when they&apos;re assigned to scenes.
              </Text>
            </View>
          ) : (
            <View style={styles.actorsGrid}>
              {actors.map(actor => (
                <ActorCard key={actor.id || actor._id} actor={actor} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Actor Edit Modal */}
      <ActorEditModal
        actor={selectedActor}
        visible={actorEditModalVisible}
        onSave={handleSaveActor}
        onCancel={handleCancelActorEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  actorsGrid: {
    gap: 16,
  },
  actorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  actorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  actorDetails: {
    gap: 12,
  },
  detailSection: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  scenesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sceneTag: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sceneText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    borderWidth: 1,
  },
  inactiveBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#166534',
  },
  inactiveText: {
    color: '#92400e',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});
