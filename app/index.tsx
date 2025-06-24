import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from './contexts/AuthContext';

export default function Index() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        // User is logged in, go to main app
        router.replace('/(tabs)');
      } else {
        // User is not logged in, go to login screen
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, currentUser, router]);

  // Show loading while determining auth state
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
