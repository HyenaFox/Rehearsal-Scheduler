// Test script to verify frontend can load global scenes
import { FlatList, Text, View } from 'react-native';

// Mock the API service response based on what we saw in the backend test
const mockScenes = [
  {
    _id: '685f8ed93239c4b6d285d27b',
    title: 'Cuban Missile Crisis',
    description: 'we\'re doing it',
    priority: 5,
    createdBy: '685f07c4d32f001fbd526274'
  },
  {
    _id: '6865b2c5b678767a2b5d0ddd',
    title: 'Joe Bones',
    description: 'I liked this one so i put it on the schedule',
    priority: 5,
    createdBy: '685f07c4d32f001fbd526274'
  },
  {
    _id: '685e27e9ce52b9e8090a30a4',
    title: 'New Scene',
    description: 'Scene description',
    priority: 5,
    createdBy: '685d84241952838095362ed5'
  },
  {
    _id: '685e2b5ef8213fb6d5188822',
    title: 'New Scene',
    description: 'Scene description',
    priority: 5,
    createdBy: '685d84241952838095362ed5'
  },
  {
    _id: '685e2b70f8213fb6d5188827',
    title: 'New Scene 1',
    description: 'Scene description',
    priority: 5,
    createdBy: '685d84241952838095362ed5'
  }
];

const SceneTestComponent = () => {
  const renderScene = ({ item: scene }) => (
    <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 5, borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
        {scene.title || scene.name || 'Untitled Scene'}
      </Text>
      <Text style={{ fontSize: 14, color: '#666' }}>
        {scene.description || 'No description'}
      </Text>
      <Text style={{ fontSize: 12, color: '#999' }}>
        ID: {scene._id || scene.id}
      </Text>
      <Text style={{ fontSize: 12, color: '#999' }}>
        Created By: {scene.createdBy || 'Unknown'}
      </Text>
      <Text style={{ fontSize: 12, color: '#999' }}>
        Priority: {scene.priority || 5}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Global Scenes Test - All Users Can See These Scenes
      </Text>
      <FlatList
        data={mockScenes}
        renderItem={renderScene}
        keyExtractor={(item) => item._id || item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SceneTestComponent;
