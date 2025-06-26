import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ApiService from '../services/api';

export default function AuthDebugScreen() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword');
  const [name, setName] = useState('Test User');
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testBackend = async () => {
    addResult('Testing backend connection...');
    const isConnected = await ApiService.testBackendConnection();
    addResult(`Backend connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
  };

  const testRegistration = async () => {
    addResult(`Testing registration: ${email}`);
    try {
      const result = await ApiService.testRegistration(email, password, name);
      addResult(`Registration: SUCCESS - User ID: ${result.user?.id}`);
    } catch (error) {
      addResult(`Registration: FAILED - ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testLogin = async () => {
    addResult(`Testing login: ${email}`);
    try {
      const result = await ApiService.testLogin(email, password);
      addResult(`Login: SUCCESS - User ID: ${result.user?.id}`);
    } catch (error) {
      addResult(`Login: FAILED - ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testTokenStatus = async () => {
    addResult('Checking token status...');
    const hasToken = await ApiService.debugTokenStorage();
    addResult(`Token status: ${hasToken ? 'EXISTS' : 'NOT FOUND'}`);
  };

  const clearToken = async () => {
    addResult('Clearing token...');
    await ApiService.debugClearToken();
    addResult('Token cleared');
  };

  const testGetCurrentUser = async () => {
    addResult('Testing getCurrentUser...');
    try {
      const user = await ApiService.getCurrentUser();
      addResult(`getCurrentUser: SUCCESS - ${user.email}`);
    } catch (error) {
      addResult(`getCurrentUser: FAILED - ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Authentication Debug Tool</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        
        <Text style={styles.label}>Name:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testBackend}>
          <Text style={styles.buttonText}>Test Backend</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testRegistration}>
          <Text style={styles.buttonText}>Test Registration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testLogin}>
          <Text style={styles.buttonText}>Test Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testTokenStatus}>
          <Text style={styles.buttonText}>Check Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testGetCurrentUser}>
          <Text style={styles.buttonText}>Get Current User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={clearToken}>
          <Text style={styles.buttonText}>Clear Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
