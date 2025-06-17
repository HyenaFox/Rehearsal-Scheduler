import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

export default function AddActorScreen() {
  const [actorName, setActorName] = useState('');

  const handleAddActor = () => {
    if (actorName.trim()) {
      Alert.alert('Success', `Actor "${actorName}" added successfully!`);
      router.back();
    } else {
      Alert.alert('Error', 'Please enter an actor name');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Actor Name:</Text>
        <TextInput
          style={styles.input}
          value={actorName}
          onChangeText={setActorName}
          placeholder="Enter actor name"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleAddActor}>
          <Text style={styles.buttonText}>Add Actor</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4682B4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});