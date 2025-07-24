import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import AuthWrapper from './components/AuthWrapper';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';

export default function RootLayout() {
  const [googleInitialized, setGoogleInitialized] = useState(Platform.OS !== 'web');

  useEffect(() => {
    // Initialize Google Sign-In for web platform with error handling
    if (Platform.OS === 'web') {
      const initializeGoogleSignIn = async () => {
        try {
          console.log('🔐 RootLayout: Initializing Google Sign-In for web...');
          
          // Dynamic import to avoid loading on non-web platforms
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          
          const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
          if (!webClientId) {
            console.warn('🔐 RootLayout: Google Web Client ID not configured');
            setGoogleInitialized(true); // Allow app to continue
            return;
          }
          
          console.log('🔐 RootLayout: Configuring Google Sign-In with Client ID:', webClientId.substring(0, 20) + '...');
          
          GoogleSignin.configure({
            webClientId: webClientId,
            offlineAccess: true,
          });
          
          console.log('🔐 RootLayout: ✅ Google Sign-In initialized for web');
          setGoogleInitialized(true);
        } catch (error) {
          console.error('🔐 RootLayout: ❌ Failed to initialize Google Sign-In:', error);
          // Allow app to continue even if Google Sign-In fails
          setGoogleInitialized(true);
        }
      };
      
      initializeGoogleSignIn();
    }
  }, []);

  // Show loading screen on web until Google Sign-In is initialized
  if (Platform.OS === 'web' && !googleInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppProvider>
        <AuthWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AuthWrapper>
      </AppProvider>
    </AuthProvider>
  );
}
