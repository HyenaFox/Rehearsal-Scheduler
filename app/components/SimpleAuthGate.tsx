import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';

interface SimpleAuthGateProps {
  children: React.ReactNode;
}

/**
 * A simple authentication gate that shows login screen if not authenticated.
 * This is a simpler alternative to complex AuthWrapper logic.
 */
export default function SimpleAuthGate({ children }: SimpleAuthGateProps) {
  const { user, isLoading } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only mark as checked after loading is complete
    if (!isLoading && !hasCheckedAuth) {
      console.log('🔐 SimpleAuthGate - Auth check complete:', user ? `user: ${user.email}` : 'no user');
      setHasCheckedAuth(true);
    }
  }, [isLoading, hasCheckedAuth, user]);

  // Show loading while checking authentication
  if (isLoading || !hasCheckedAuth) {
    console.log('🔐 SimpleAuthGate - Showing loading...', { isLoading, hasCheckedAuth });
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // Show login screen if no user
  if (!user) {
    console.log('🔐 SimpleAuthGate - No user, showing login');
    return <LoginScreen />;
  }

  // Show main app if user is logged in
  console.log('🔐 SimpleAuthGate - User authenticated, showing app');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});
