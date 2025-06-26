import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

export default function DebugScreen() {
  const { user, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [apiTestResult, setApiTestResult] = useState<string>('Not tested');

  const addDebugLine = (line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${line}`]);
    console.log(`[DEBUG] ${line}`);
  };

  useEffect(() => {
    addDebugLine(`AuthContext state - isLoading: ${isLoading}, user: ${user ? 'exists' : 'null'}`);
  }, [user, isLoading]);

  const testApiConnection = async () => {
    addDebugLine('Testing API connection...');
    try {
      const result = await ApiService.testBackendConnection();
      setApiTestResult(result ? 'SUCCESS' : 'FAILED');
      addDebugLine(`API test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      setApiTestResult('ERROR');
      addDebugLine(`API test error: ${error}`);
    }
  };

  const testDirectFetch = async () => {
    addDebugLine('Testing direct fetch to localhost:3000/health...');
    try {
      const response = await fetch('http://localhost:3000/health');
      const data = await response.json();
      addDebugLine(`Direct fetch SUCCESS: ${JSON.stringify(data)}`);
    } catch (error) {
      addDebugLine(`Direct fetch ERROR: ${error}`);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Screen</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current State:</Text>
        <Text>Is Loading: {String(isLoading)}</Text>
        <Text>User: {user ? `${user.email} (${user.name})` : 'null'}</Text>
        <Text>API Test: {apiTestResult}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions:</Text>
        <TouchableOpacity style={styles.button} onPress={testApiConnection}>
          <Text style={styles.buttonText}>Test API Connection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={testDirectFetch}>
          <Text style={styles.buttonText}>Test Direct Fetch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clearDebugInfo}>
          <Text style={styles.buttonText}>Clear Debug Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Log:</Text>
        {debugInfo.map((line, index) => (
          <Text key={index} style={styles.debugLine}>{line}</Text>
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
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  debugLine: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginVertical: 1,
    color: '#333',
  },
});
