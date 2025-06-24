import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { HybridStorageService } from '../services/hybridStorage';

const ImprovedLoginScreen = () => {
  const { login, addNewUser, users } = useAuth();
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useEmailAuth, setUseEmailAuth] = useState(false);

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = async () => {
    if (!emailOrUsername.trim()) {
      Alert.alert('Error', 'Please enter a username or email');
      return;
    }

    setIsLoading(true);
    
    try {
      let success = false;
      
      if (useEmailAuth && password.trim()) {
        // Try email/password login
        const result = await HybridStorageService.signIn(emailOrUsername.trim(), password.trim());
        success = result.success;
        
        if (!success) {
          Alert.alert('Error', result.error || 'Login failed');
        }
      } else {
        // Try username-only login (backwards compatibility)
        success = await login(emailOrUsername.trim());
        
        if (!success) {
          Alert.alert(
            'User Not Found', 
            'Username not found. Would you like to create a new account or switch to email/password login?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Up', onPress: () => setIsSignUp(true) },
              { text: 'Use Email', onPress: () => setUseEmailAuth(true) }
            ]
          );
        }
      }
      
      if (success) {
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    if (!emailOrUsername.trim()) {
      Alert.alert('Error', 'Please enter a username or email');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    setIsLoading(true);
    
    try {
      let success = false;
      
      if (useEmailAuth && password.trim()) {
        // Email/password signup
        if (!isValidEmail(emailOrUsername)) {
          Alert.alert('Error', 'Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        
        const username = emailOrUsername.split('@')[0]; // Generate username from email
        const result = await HybridStorageService.signUp(
          emailOrUsername.trim(), 
          password.trim(), 
          username,
          displayName.trim()
        );
        
        success = result.success;
        
        if (!success) {
          Alert.alert('Error', result.error || 'Sign up failed');
        }
      } else {
        // Username-only signup (backwards compatibility)
        success = await addNewUser(emailOrUsername.trim(), displayName.trim());
        
        if (!success) {
          Alert.alert('Error', 'Username already exists. Please choose a different username.');
        }
      }
      
      if (success) {
        Alert.alert('Welcome!', 'Your account has been created and you are now logged in.', [
          { 
            text: 'Continue',
            onPress: () => {
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 100);
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmailOrUsername('');
    setPassword('');
    setDisplayName('');
    setIsSignUp(false);
  };

  const handleTestLogin = async () => {
    setEmailOrUsername('admin');
    setIsLoading(true);
    
    try {
      const success = await login('admin');
      
      if (success) {
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Error', 'Test admin user not found. Please try signing up first.');
      }
    } catch (error) {
      console.error('Test login error:', error);
      Alert.alert('Error', 'Test login failed.');
    }
    
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🎭 Rehearsal Scheduler</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Auth Mode Toggle */}
            <View style={styles.authModeToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, !useEmailAuth && styles.toggleButtonActive]}
                onPress={() => setUseEmailAuth(false)}
              >
                <Text style={[styles.toggleButtonText, !useEmailAuth && styles.toggleButtonTextActive]}>
                  Username
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, useEmailAuth && styles.toggleButtonActive]}
                onPress={() => setUseEmailAuth(true)}
              >
                <Text style={[styles.toggleButtonText, useEmailAuth && styles.toggleButtonTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Username/Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {useEmailAuth ? 'Email Address' : 'Username'}
              </Text>
              <TextInput
                style={styles.input}
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                placeholder={useEmailAuth ? 'Enter your email' : 'Enter your username'}
                autoCapitalize="none"
                keyboardType={useEmailAuth ? 'email-address' : 'default'}
                disabled={isLoading}
              />
            </View>

            {/* Password Input (only for email auth) */}
            {useEmailAuth && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  disabled={isLoading}
                />
              </View>
            )}

            {/* Display Name Input (only for signup) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your display name"
                  disabled={isLoading}
                />
              </View>
            )}

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={isSignUp ? handleSignUp : handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Toggle between login/signup */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            {/* Cancel button for signup */}
            {isSignUp && (
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={resetForm}
                disabled={isLoading}
              >
                <Text style={styles.tertiaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            {/* Debug button for testing */}
            {!isSignUp && !useEmailAuth && (
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: '#f3f4f6' }]}
                onPress={handleTestLogin}
                disabled={isLoading}
              >
                <Text style={[styles.secondaryButtonText, { color: '#6b7280' }]}>
                  🔧 Test Login (admin)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Show existing users for reference (in development) */}
          {users.length > 0 && !isSignUp && !useEmailAuth && (
            <View style={styles.usersHint}>
              <Text style={styles.usersHintTitle}>Existing Users:</Text>
              {users.slice(0, 5).map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.userHint}
                  onPress={() => setEmailOrUsername(user.username)}
                  disabled={isLoading}
                >
                  <Text style={styles.userHintText}>
                    {user.displayName} (@{user.username})
                    {user.isAdmin && ' 👑'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.infoText}>
              🎯 Create your personal profile to:
              {'\n'}• Set your availability
              {'\n'}• Choose your scenes
              {'\n'}• Get smart rehearsal suggestions
              {'\n'}• Keep your info private
              {'\n'}
              {'\n'}💡 Tip: Email login offers better security and multi-device sync!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  authModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#6366f1',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  tertiaryButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  usersHint: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  usersHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  userHint: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginBottom: 4,
  },
  userHintText: {
    fontSize: 13,
    color: '#6b7280',
  },
  info: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default ImprovedLoginScreen;
