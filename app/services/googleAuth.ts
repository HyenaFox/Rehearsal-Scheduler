import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Configure Google Sign-In for mobile
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // from Google Cloud Console
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

// Simplified web Google Sign-In using popup
const signInWithGoogleWeb = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    
    if (!CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    // Create OAuth URL
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    
    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    // Open popup window
    const popup = window.open(
      authUrl,
      'google-signin',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      reject(new Error('Failed to open Google Sign-In popup. Please allow popups for this site.'));
      return;
    }

    // Listen for popup to close or message
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Google Sign-In was cancelled'));
      }
    }, 1000);

    // Listen for messages from popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve(event.data.code);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error || 'Google Sign-In failed'));
      }
    };

    window.addEventListener('message', messageListener);

    // Fallback: If we can't get the message, try to detect success by URL change
    setTimeout(() => {
      try {
        const popupUrl = popup.location?.href;
        if (popupUrl && popupUrl.includes('code=')) {
          const urlParams = new URLSearchParams(popupUrl.split('?')[1]);
          const code = urlParams.get('code');
          if (code) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();
            resolve(code);
          }
        }
      } catch {
        // Cross-origin error expected, ignore
      }
    }, 2000);
  });
};

export const signInWithGoogle = async () => {
  try {
    if (Platform.OS === 'web') {
      return await signInWithGoogleWeb();
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
