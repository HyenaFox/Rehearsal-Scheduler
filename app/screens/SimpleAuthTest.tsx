import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService, { testApiConnection } from '../services/api';

export default function SimpleAuthTest() {
  const { user, isLoading, login } = useAuth();

  console.log('🧪 SimpleAuthTest - Current state:', {
    hasUser: !!user,
    userEmail: user?.email,
    isLoading,
    timestamp: new Date().toISOString()
  });

  const testApi = async () => {
    console.log('🧪 Testing API connection...');
    try {
      const connected = await testApiConnection();
      console.log('🧪 API connection result:', connected);
      Alert.alert('API Test', connected ? 'API is reachable' : 'API is not reachable');
    } catch (error) {
      console.error('🧪 API connection error:', error);
      Alert.alert('API Error', 'API connection failed: ' + (error as any)?.message || 'Unknown error');
    }
  };

  const testDirectApiLogin = async () => {
    console.log('🧪 Testing direct API login...');
    try {
      const response = await ApiService.login({ email: 'test@test.com', password: 'test123' });
      console.log('🧪 Direct API login response:', response);
      Alert.alert('Direct API Login', `Response: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('🧪 Direct API login error:', error);
      Alert.alert('Direct API Error', 'Error: ' + (error as any)?.message || 'Unknown error');
    }
  };

  const testLogin = async () => {
    console.log('🧪 Starting test login...');
    console.log('🧪 Current auth state before login:', { hasUser: !!user, isLoading });
    
    try {
      console.log('🧪 Calling login function with test@test.com...');
      const success = await login('test@test.com', 'test123');
      
      console.log('🧪 Login function returned:', success);
      console.log('🧪 Auth state after login function:', { hasUser: !!user, userEmail: user?.email, isLoading });
      
      // Wait a moment for state to update
      setTimeout(() => {
        console.log('🧪 Auth state after timeout:', { hasUser: !!user, userEmail: user?.email, isLoading });
      }, 1000);
      
      if (success) {
        Alert.alert('Success', `Login successful! User: ${user?.email || 'unknown'}`);
      } else {
        Alert.alert('Failed', 'Login failed - check console for details');
      }
    } catch (error) {
      console.error('🧪 Login error:', error);
      Alert.alert('Error', 'Login error: ' + (error as any)?.message || 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Authentication Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Auth Test</Text>
      
      <Text style={styles.status}>
        Status: {user ? `Logged in as ${user.email}` : 'Not logged in'}
      </Text>
      
      <Text style={styles.status}>
        Loading: {isLoading ? 'Yes' : 'No'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={testLogin}>
        <Text style={styles.buttonText}>Test Login (test@test.com)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testDirectApiLogin}>
        <Text style={styles.buttonText}>Test Direct API Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testApi}>
        <Text style={styles.buttonText}>Test API Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => console.log('🧪 Current auth state:', { user, isLoading })}
      >
        <Text style={styles.buttonText}>Log Current State</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
