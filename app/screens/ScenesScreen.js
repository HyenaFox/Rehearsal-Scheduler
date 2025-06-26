import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';
import SceneEditModal from '../components/SceneEditModal';
import { useApp } from '../contexts/AppContext';
import ApiService from '../services/api';
import { commonStyles } from '../styles/common';
import { getActorsInScene, removeScene } from '../utils/actorUtils';

const ScenesScreen = ({ onBack }) => {
  const { scenes, setScenes, actors, setActors } = useApp();
  const [editingScene, setEditingScene] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDeleteScene = async (sceneId) => {
    const sceneToDelete = scenes.find(s => s.id === sceneId);
    
    try {
      // Delete from API
      await ApiService.deleteScene(sceneId);
      
      // Remove from local state
      const updatedScenes = scenes.filter(s => s.id !== sceneId);
      setScenes(updatedScenes);

      // Remove from all actors (this should ideally be handled by the backend)
      const updatedActors = actors.map(actor => 
        removeScene(actor, sceneToDelete.title)
      );
      setActors(updatedActors);
      
      Alert.alert('Success', 'Scene deleted successfully');
    } catch (error) {
      console.error('Failed to delete scene:', error);
      Alert.alert('Error', 'Failed to delete scene');
    }
  };

  const handleAddScene = () => {
    // Set up for creating a new scene
    const newScene = {
      title: 'New Scene',
      description: 'Scene description',
      duration: 30
    };
    
    setEditingScene(newScene);
    setShowEditModal(true);
  };

  const handleEditScene = (scene) => {
    setEditingScene(scene);
    setShowEditModal(true);
  };

  const handleSaveScene = async (editedScene) => {
    try {
      let updatedScene;
      
      if (editedScene.id) {
        // Update existing scene
        updatedScene = await ApiService.updateScene(editedScene.id, editedScene);
        
        // Update local state
        const updatedScenes = scenes.map(s => 
          s.id === editedScene.id ? updatedScene : s
        );
        setScenes(updatedScenes);
        
        Alert.alert('Success', 'Scene updated successfully');
      } else {
        // Create new scene
        updatedScene = await ApiService.createScene(editedScene);
        
        // Add to local state
        const updatedScenes = [...scenes, updatedScene];
        setScenes(updatedScenes);
        
        Alert.alert('Success', 'Scene added successfully');
      }
      
      setShowEditModal(false);
      setEditingScene(null);
    } catch (error) {
      console.error('Failed to save scene:', error);
      Alert.alert('Error', 'Failed to save scene');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingScene(null);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" />
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          {onBack && (
            <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
              <Text style={commonStyles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={commonStyles.headerTitle}>Manage Scenes</Text>
        </View>

        <View style={commonStyles.scrollView}>
          <ActionButton title="Add New Scene" onPress={handleAddScene} />

          <ScrollView style={commonStyles.scrollView}>
            {(!scenes || scenes.length === 0) ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No scenes available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first scene to organize your rehearsals.
                </Text>
              </View>
            ) : (
              scenes.map((scene) => {
                const actorsInScene = getActorsInScene(actors, scene.title);
                
                return (
                  <Card
                    key={scene.id}
                    title={scene.title}
                    subtitle={scene.description}
                    description={`Actors: ${actorsInScene.length}`}
                    onEdit={() => handleEditScene(scene)}
                    onDelete={() => handleDeleteScene(scene.id)}
                  />
                );
              })
            )}
          </ScrollView>
        </View>

        <SceneEditModal
          scene={editingScene}
          visible={showEditModal}
          onSave={handleSaveScene}
          onCancel={handleCancelEdit}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = {
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
};

export default ScenesScreen;
