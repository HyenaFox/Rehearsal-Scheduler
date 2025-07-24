import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorModal from '../components/ErrorModal';

export default function ErrorDemoScreen() {
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error');

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const demoLoginError = () => {
    showError('Login Failed', 'Invalid email or password. Please check your credentials and try again.');
  };

  const demoGoogleError = () => {
    showError('Google Sign-In Unavailable', 'This app is currently in testing mode. Please use email/password login or contact the developer to be added as a test user.');
  };

  const demoRegistrationError = () => {
    showError('Registration Failed', 'An account with this email already exists. Please try logging in instead.');
  };

  const demoNetworkError = () => {
    showError('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error Handling Demo</Text>
      <Text style={styles.subtitle}>Test the new error modal system</Text>

      <TouchableOpacity style={styles.button} onPress={demoLoginError}>
        <Text style={styles.buttonText}>Demo Login Error</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={demoGoogleError}>
        <Text style={styles.buttonText}>Demo Google OAuth Error</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={demoRegistrationError}>
        <Text style={styles.buttonText}>Demo Registration Error</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={demoNetworkError}>
        <Text style={styles.buttonText}>Demo Network Error</Text>
      </TouchableOpacity>

      <ErrorModal
        visible={errorModalVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#374151',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
