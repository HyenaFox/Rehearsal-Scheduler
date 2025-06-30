import { useAuth } from '@/app/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function GoogleCallback() {
  const { googleLogin } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleLogin = async (idToken: string) => {
      const success = await googleLogin(idToken);
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
      const error = params.error || 'An unknown error occurred during Google Sign-In.';
      alert(`Login Error: ${error}`);
      router.replace('/');
    }
  }, [params, googleLogin]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Finalizing login...</Text>
    </View>
  );
}
