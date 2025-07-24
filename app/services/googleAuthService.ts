import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

console.log('🔥 NEW googleAuthService.ts: Module loading, Platform.OS:', Platform.OS);

// Configure Google Sign-In
function configureGoogleSignIn() {
  try {
    console.log('🔥 configureGoogleSignIn starting...');
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    
    if (!webClientId) {
      console.error('🔥 ❌ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured');
      if (Platform.OS !== 'web') {
        throw new Error('Google Client ID not configured');
      }
      return;
    }
    
    GoogleSignin.configure({
      webClientId: webClientId,
      offlineAccess: true,
    });
    
    console.log('🔥 ✅ Google Sign-In configured successfully');
  } catch (error) {
    console.error('🔥 ❌ Failed to configure Google Sign-In:', error);
    if (Platform.OS !== 'web') {
      throw error;
    }
  }
}

// Initialize configuration for mobile
if (Platform.OS !== 'web') {
  configureGoogleSignIn();
}

// Web sign-in implementation
function handleWebGoogleSignIn() {
  console.log('🔥 handleWebGoogleSignIn starting...');
  
  let CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  
  // Development fallback
  if (!CLIENT_ID && process.env.NODE_ENV === 'development') {
    CLIENT_ID = '857657662535-cd6capub87vghupi38g1fcar6hcch7ug.apps.googleusercontent.com';
    console.log('🔥 Using development fallback CLIENT_ID');
  }
  
  if (!CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  console.log('🔥 Using Client ID:', CLIENT_ID.substring(0, 20) + '...');
  console.log('🔥 Full Client ID for debugging:', CLIENT_ID);

  const redirectUri = `${window.location.origin}/auth/google/callback`;
  console.log('🔥 Using redirect URI:', redirectUri);
  console.log('🔥 Window location origin:', window.location.origin);
  console.log('🔥 Full window location:', window.location.href);

  const scope = 'openid email profile';
  const responseType = 'code';  // Use authorization code flow instead of implicit flow
  const state = Math.random().toString(36).substring(2, 15);
  
  // Use the correct Google OAuth 2.0 authorization endpoint
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=${responseType}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('🔗 Full auth URL:', authUrl);
  console.log('🔗 Redirecting to Google OAuth');
  window.location.href = authUrl;
}

// Mobile sign-in implementation
async function handleMobileGoogleSignIn() {
  try {
    console.log('📱 handleMobileGoogleSignIn starting...');
    
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    console.log('📱 Mobile Google Sign-In successful');
    return userInfo;
  } catch (error: any) {
    console.error('📱 Mobile Google Sign-In error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available');
    } else {
      throw error;
    }
  }
}

// Main export function with NEW NAME
export function googleSignInHandler() {
  console.log('🔥 googleSignInHandler called, Platform.OS:', Platform.OS);
  console.log('🔥 googleSignInHandler: typeof this function:', typeof googleSignInHandler);
  
  if (Platform.OS === 'web') {
    console.log('🔥 Calling web implementation');
    return handleWebGoogleSignIn();
  } else {
    console.log('🔥 Calling mobile implementation');
    return handleMobileGoogleSignIn();
  }
}

// Sign out function
export async function googleSignOutHandler() {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    console.log('✅ Google Sign-Out successful');
  } catch (error) {
    console.error('❌ Google Sign-Out error:', error);
    throw error;
  }
}

// Export configuration function
export const initializeGoogleAuth = configureGoogleSignIn;

console.log('🔥 googleAuthService.ts: Module loaded completely');
console.log('🔥 googleSignInHandler type:', typeof googleSignInHandler);
console.log('🔥 googleSignOutHandler type:', typeof googleSignOutHandler);

if (typeof googleSignInHandler !== 'function') {
  console.error('🔥 CRITICAL: googleSignInHandler is not a function!');
} else {
  console.log('🔥 ✅ googleSignInHandler is properly exported as a function');
}
