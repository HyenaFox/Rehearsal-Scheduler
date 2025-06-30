import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function GoogleCallback() {
  const { googleLogin } = useAuth();

  useEffect(() => {
    const handleLogin = async (idToken: string) => {
      const success = await googleLogin(idToken);
      // Redirect immediately based on success, don't wait for other state changes
      if (success) {
        router.replace('/(tabs)/profile');
      } else {
        alert('Google login failed. Please try again.');
        router.replace('/');
      }
    };

    const hash = window.location.hash.substring(1);
    const urlParams = new URLSearchParams(hash);
    const idToken = urlParams.get('id_token');

    if (idToken) {
      handleLogin(idToken);
    } else {
      // Use a timeout to ensure any initial rendering is complete before alerting
      setTimeout(() => {
        alert('Login Error: No token received from Google.');
        router.replace('/');
      }, 100);
    };
    // The dependency array is intentionally empty to ensure this runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Finalizing login...</Text>
    </View>
  );
}
