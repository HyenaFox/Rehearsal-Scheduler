import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';
import SceneEditModal from '../components/SceneEditModal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';

const ScenesScreen = ({ onBack }) => {
  const { scenes, setScenes, actors, setActors } = useApp();
  const { user } = useAuth();
  
  // Admin check
  const isAdmin = user?.isAdmin || false;
  
  const [editingScene, setEditingScene] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const handleDeleteScene = async (sceneToDelete) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can delete scenes.');
      return;
    }
    
    try {
      await ApiService.deleteScene(sceneToDelete.id || sceneToDelete._id);
      const updatedScenes = scenes.filter(s => (s.id || s._id) !== (sceneToDelete.id || sceneToDelete._id));
      setScenes(updatedScenes);
      
      // Remove scene from all actors who were assigned to it
      const sceneIdToDelete = sceneToDelete.id || sceneToDelete._id;
      const updatedActors = actors.map(actor => ({
        ...actor,
        scenes: actor.scenes.filter(sceneId => sceneId !== sceneIdToDelete)
      }));
      setActors(updatedActors);
      
      console.log('✅ Scene deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting scene:', error);
      Alert.alert('Error', 'Failed to delete scene');
    }
  };

  const handleAddScene = async () => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can add scenes.');
      return;
    }
    
    try {
      const newScene = {
        title: 'New Scene',
        description: 'Scene description',
        actorsRequired: [],
        location: '',
        duration: 60,
        priority: 5
      };
      
      const createdScene = await ApiService.createScene(newScene);
      const updatedScenes = [...scenes, createdScene];
      setScenes(updatedScenes);
      console.log('✅ Scene created successfully');
    } catch (error) {
      console.error('❌ Error creating scene:', error);
      Alert.alert('Error', 'Failed to create scene');
    }
  };

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={commonStyles.contentContainer}>
        <View style={commonStyles.headerSection}>
          <View style={commonStyles.screenTitleContainer}>
            <Text style={commonStyles.screenTitle}>🎬 Scenes</Text>
          </View>
          <Text style={commonStyles.subtitle}>
            Global production scenes available to all cast members
          </Text>
          
          {!isAdmin && (
            <View style={[commonStyles.card, { marginTop: 16, marginBottom: 16 }]}>
              <Text style={[commonStyles.cardTitle, { fontSize: 16, marginBottom: 8 }]}>
                ℹ️ About Scenes
              </Text>
              <Text style={[commonStyles.text, { fontSize: 14, color: '#6b7280', lineHeight: 20 }]}>
                These are global scenes created by administrators. You can select which scenes you&apos;re involved in through your Profile → Actor Settings.
              </Text>
            </View>
          )}
          
          {isAdmin && (
            <ActionButton title="➕ Add New Scene" onPress={handleAddScene} />
          )}
        </View>

        <ScrollView 
          style={commonStyles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {scenes.length === 0 ? (
            <View style={commonStyles.emptyState}>
              <Text style={commonStyles.emptyStateText}>
                No global scenes defined yet.{isAdmin ? ' Tap "Add New Scene" to get started!' : ' Ask an admin to create scenes for the production.'}
              </Text>
            </View>
          ) : (
            scenes.map(scene => (
              <Card
                key={scene.id}
                title={scene.title}
                sections={[
                  {
                    title: 'Description',
                    content: scene.description || 'No description provided'
                  },
                  {
                    title: 'Actors in this Scene',
                    content: actors.filter(actor => {
                      // Use the same logic as the actors screen: check if scene ID is in actor's scenes array
                      const actorScenes = actor.scenes || [];
                      const sceneId = scene.id || scene._id;
                      return actorScenes.includes(sceneId);
                    }).map(actor => actor.name).join(', ') || 'No actors assigned'
                  }
                ]}
                onEdit={isAdmin ? () => {
                  setEditingScene(scene);
                  setShowEditModal(true);
                } : undefined}
                onDelete={isAdmin ? () => handleDeleteScene(scene) : undefined}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Scene Edit Modal */}
      <SceneEditModal
        scene={editingScene}
        visible={showEditModal}
        onSave={async (updatedScene) => {
          try {
            const savedScene = await ApiService.updateScene(updatedScene.id || updatedScene._id, updatedScene);
            const updatedScenes = scenes.map(s => 
              (s.id || s._id) === (updatedScene.id || updatedScene._id) ? savedScene : s
            );
            
            setScenes(updatedScenes);
            
            // Update actors if scene title changed
            if (editingScene.title !== updatedScene.title) {
              const updatedActors = actors.map(actor => {
                if (actor.scenes && actor.scenes.includes(editingScene.title)) {
                  const newScenes = actor.scenes.map(sceneName => 
                    sceneName === editingScene.title ? updatedScene.title : sceneName
                  );
                  return { ...actor, scenes: newScenes };
                }
                return actor;
              });
              setActors(updatedActors);
            }

            setShowEditModal(false);
            setEditingScene(null);
            console.log('✅ Scene updated successfully');
          } catch (error) {
            console.error('❌ Error updating scene:', error);
            Alert.alert('Error', 'Failed to update scene');
          }
        }}
        onCancel={() => {
          setShowEditModal(false);
          setEditingScene(null);
        }}
        allActors={actors}
      />
    </SafeAreaView>
  );
};

export default ScenesScreen;
