import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
  const { login, signUp, isLoading, currentUser } = useAuth();
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      router.replace('/(tabs)');
    }
  }, [currentUser]);

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email/username and password');
      return;
    }

    setIsAuthLoading(true);
    try {
      console.log('Attempting login with:', emailOrUsername);
      const result = await login(emailOrUsername.trim(), password.trim());
      console.log('Login result:', result);
      
      if (result.success) {
        // Navigate to main app
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!emailOrUsername.trim() || !password.trim() || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!emailOrUsername.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address for sign up');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsAuthLoading(true);
    try {
      // Generate username from email or use display name
      const username = displayName.toLowerCase().replace(/\s+/g, '');
      const result = await signUp(emailOrUsername.trim(), password.trim(), username, displayName.trim());
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Sign Up Failed', result.message || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during sign up');
    } finally {
      setIsAuthLoading(false);
    }
  };
  const tryDefaultLogin = async () => {
    setIsAuthLoading(true);
    try {
      console.log('Trying default admin login...');
      const result = await login('admin', 'admin123');
      console.log('Default login result:', result);
      
      if (result.success) {
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Default Login Failed', result.message || 'The default admin account may not exist yet');
      }
    } catch (error) {
      console.error('Default login error:', error);
      Alert.alert('Error', 'Failed to log in with default credentials: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isSignUpMode ? 'Create Account' : '🎭 Rehearsal Scheduler'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder={isSignUpMode ? "Email" : "Email or Username"}
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={isSignUpMode ? "email-address" : "default"}
            editable={!isAuthLoading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isAuthLoading}
          />
          
          {isSignUpMode && (
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isAuthLoading}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={isSignUpMode ? handleSignUp : handleLogin}
            disabled={isAuthLoading}
          >
            {isAuthLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUpMode ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setIsSignUpMode(!isSignUpMode)}
            disabled={isAuthLoading}
          >
            <Text style={styles.secondaryButtonText}>
              {isSignUpMode ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>
          
          {!isSignUpMode && (
            <TouchableOpacity 
              style={[styles.button, styles.defaultButton]}
              onPress={tryDefaultLogin}
              disabled={isAuthLoading}
            >
              <Text style={styles.defaultButtonText}>
                Try Default Admin Login
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.info}>
            <Text style={styles.infoText}>
              🎯 Create your personal profile to:
              {'\n'}• Set your availability
              {'\n'}• Choose your scenes
              {'\n'}• Get smart rehearsal suggestions
              {'\n'}• Your data is stored locally on this device
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginVertical: 5,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  defaultButton: {
    backgroundColor: '#FF9500',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default LoginScreen;
