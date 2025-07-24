import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function GoogleCallback() {
  const { googleLogin } = useAuth();

  useEffect(() => {
    console.log('🔗 Google callback page loaded');
    console.log('🔗 Current URL:', window.location.href);
    console.log('🔗 Search params:', window.location.search);
    console.log('🔗 Hash:', window.location.hash);
    
    const handleLogin = async (tokenOrCode: string, isCode: boolean = false) => {
      try {
        const success = await googleLogin(tokenOrCode, isCode);
        if (success) {
          // For development, add a small delay to ensure localStorage is updated
          if (__DEV__) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          router.replace('/(tabs)/profile');
        } else {
          alert('Google login failed. Please try again.');
          router.replace('/');
        }
      } catch (error) {
        console.error('🔗 Callback login error:', error);
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
