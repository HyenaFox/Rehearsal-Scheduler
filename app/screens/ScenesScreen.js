import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';
import SceneEditModal from '../components/SceneEditModal';
import { useApp } from '../contexts/AppContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';
import { getActorsInScene, removeScene } from '../utils/actorUtils';

const ScenesScreen = ({ onBack, actors, setActors }) => {
  const [scenes, setScenes] = useState(GLOBAL_SCENES);
  const [editingScene, setEditingScene] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const handleDeleteScene = async (sceneId) => {
    const sceneToDelete = scenes.find(s => s.id === sceneId);
    
    // Direct deletion without confirmation
    // Remove from global scenes
    const updatedScenes = scenes.filter(s => s.id !== sceneId);
    setScenes(updatedScenes);
    GLOBAL_SCENES.length = 0;
    GLOBAL_SCENES.push(...updatedScenes);
    await AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(updatedScenes));

    // Remove from all actors
    const updatedActors = actors.map(actor => 
      removeScene(actor, sceneToDelete.title)
    );
    setActors(updatedActors);
  };

  const handleAddScene = async () => {
    const newId = `scene-${Date.now()}`;
    const newScene = {
      id: newId,
      title: 'New Scene',
      description: 'Scene description'
    };
    
    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    GLOBAL_SCENES.length = 0;
    GLOBAL_SCENES.push(...updatedScenes);
    await AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(updatedScenes));
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" />
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
            <Text style={commonStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Manage Scenes</Text>
        </View>

        <View style={commonStyles.scrollView}>
          <ActionButton title="Add New Scene" onPress={handleAddScene} />

          <ScrollView style={{ flex: 1 }}>
            {scenes.map(scene => (
              <Card
                key={scene.id}
                title={scene.title}
                sections={[
                  {
                    title: 'Description',
                    content: scene.description
                  },
                  {
                    title: 'Actors in this Scene',
                    content: getActorsInScene(actors, scene.title).map(actor => actor.name).join(', ') || 'No actors assigned'
                  }
                ]}
                onEdit={() => {
                  setEditingScene(scene);
                  setShowEditModal(true);
                }}
                onDelete={() => handleDeleteScene(scene.id)}
              />
            ))}
            {scenes.length === 0 && (
              <View style={commonStyles.emptyState}>
                <Text style={commonStyles.emptyStateText}>No scenes available</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Scene Edit Modal */}
        <SceneEditModal
          scene={editingScene}
          visible={showEditModal}
          onSave={async (updatedScene) => {
            const updatedScenes = scenes.map(s => 
              s.id === updatedScene.id ? updatedScene : s
            );
            
            setScenes(updatedScenes);
            GLOBAL_SCENES.length = 0;
            GLOBAL_SCENES.push(...updatedScenes);
            await AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(updatedScenes));

            // Update actors if scene title changed
            if (editingScene.title !== updatedScene.title) {
              const updatedActors = actors.map(actor => {
                const sceneIndex = actor.scenes.indexOf(editingScene.title);
                if (sceneIndex !== -1) {
                  const newScenes = [...actor.scenes];
                  newScenes[sceneIndex] = updatedScene.title;
                  return { ...actor, scenes: newScenes };
                }
                return actor;
              });
              setActors(updatedActors);
            }

            setShowEditModal(false);
            setEditingScene(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingScene(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default ScenesScreen;
