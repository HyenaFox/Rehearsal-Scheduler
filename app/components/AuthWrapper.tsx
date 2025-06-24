import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth();
  const [forceLoginScreen, setForceLoginScreen] = useState(false);

  useEffect(() => {
    console.log('AuthWrapper - user state changed:', user ? 'logged in' : 'logged out');
    console.log('AuthWrapper - isLoading:', isLoading);
    console.log('AuthWrapper - user object:', user);
    
    // If user becomes null, force login screen for a moment to ensure proper transition
    if (!user && !isLoading) {
      setForceLoginScreen(true);
      // Reset after a tiny delay to ensure clean state
      setTimeout(() => setForceLoginScreen(false), 100);
    }
  }, [user, isLoading]);

  if (isLoading) {
    console.log('AuthWrapper - showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user || forceLoginScreen) {
    console.log('AuthWrapper - no user, showing login screen');
    return <LoginScreen />;
  }

  console.log('AuthWrapper - user logged in, showing main app');
  return (
    <>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
