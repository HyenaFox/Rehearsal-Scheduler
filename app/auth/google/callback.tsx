import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function GoogleCallback() {
  const { googleLogin } = useAuth();

  useEffect(() => {
    const handleLogin = async (tokenOrCode: string, isCode: boolean = false) => {
      const success = await googleLogin(tokenOrCode, isCode);
      // Redirect immediately based on success, don't wait for other state changes
      if (success) {
        router.replace('/(tabs)/profile');
      } else {
        alert('Google login failed. Please try again.');
        router.replace('/');
      }
    };

    // Check for authorization code (from query params)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleLogin(code, true);
      return;
    }

    // Fallback: Check for ID token (from hash - legacy flow)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const idToken = hashParams.get('id_token');

    if (idToken) {
      handleLogin(idToken, false);
    } else {
      // Use a timeout to ensure any initial rendering is complete before alerting
      setTimeout(() => {
        alert('Login Error: No authorization code or token received from Google.');
        router.replace('/');
      }, 100);
    };
    // The dependency array is intentionally empty to ensure this runs only once.
     
  }, [googleLogin]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20 }}>Finalizing login...</Text>
    </View>
  );
}
