import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import { testApiConnection } from '../services/api';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth();

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

  if (isLoading) {
    console.log('AuthWrapper - showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
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
