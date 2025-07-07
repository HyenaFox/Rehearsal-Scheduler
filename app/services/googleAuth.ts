import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Configure Google Sign-In for mobile
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // from Google Cloud Console
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

// Simplified web Google Sign-In using proper redirect flow
const signInWithGoogleWeb = (): void => {
  const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  
  if (!CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  // Use proper redirect URI that matches our app
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  console.log('🔗 Google OAuth redirect URI:', redirectUri);
  
  const scope = 'openid email profile';
  const responseType = 'id_token';
  const nonce = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=${responseType}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `nonce=${nonce}`;

  console.log('🔗 Redirecting to Google OAuth:', authUrl);
  
  // Redirect to Google OAuth (this will redirect back to our callback)
  window.location.href = authUrl;
};

export const signInWithGoogle = async () => {
  try {
    if (Platform.OS === 'web') {
      signInWithGoogleWeb(); // This redirects to Google, callback will handle the token
      return; // Function doesn't return a value for web, redirect handles it
    }
    
    // Mobile implementation
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }
    
    return idToken;
    
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    
    if (Platform.OS !== 'web' && error.code) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }
    }
    
    throw error; // Re-throw the original error
  }
};

export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
  }
};
