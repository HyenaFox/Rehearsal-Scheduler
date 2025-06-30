import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { testApiConnection } from '../services/api';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading, isLoggingIn } = useAuth();

  useEffect(() => {
    console.log('AuthWrapper - user state changed:', user ? `logged in as ${user.email}` : 'logged out');
    console.log('AuthWrapper - isLoading:', isLoading);
    console.log('AuthWrapper - user object:', user);
    
    // Test API connection when wrapper initializes
    if (!user && !isLoading) {
      console.log('AuthWrapper - Testing API connection...');
      testApiConnection().then(connected => {
        if (connected) {
          console.log('✅ AuthWrapper - API connection is working');
        } else {
          console.log('❌ AuthWrapper - API connection failed - this may cause login issues');
        }
      }).catch(err => {
        console.log('❌ AuthWrapper - API connection test failed with error:', err);
      });
    }
  }, [user, isLoading]);

  // Show loading spinner while authenticating or logging in
  if (isLoading || isLoggingIn) {
    console.log('AuthWrapper - showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Always show main app, authentication is now handled per-screen
  console.log('AuthWrapper - showing main app, user:', user ? `logged in as ${user.email}` : 'not logged in');
  console.log('AuthWrapper - about to render children');
  
  // Add a fallback in case children is undefined (happens during static rendering)
  if (!children) {
    console.error('AuthWrapper - children is undefined!');
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading app...</Text>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
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
