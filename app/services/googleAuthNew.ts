import { Platform } from 'react-native';

console.log('🔥 NEW googleAuthNew.ts: Module starting to load, Platform.OS:', Platform.OS);

// Simplified function that should definitely work
export function signInWithGoogle() {
  console.log('🔥 NEW signInWithGoogle called, Platform.OS:', Platform.OS);
  
  if (Platform.OS === 'web') {
    console.log('🔥 NEW Web platform detected');
    alert('Google Sign-In would work here - this is a test function');
  } else {
    console.log('🔥 NEW Mobile platform detected');
  }
}

export async function signOut() {
  console.log('🔥 NEW signOut called');
}

export const initializeGoogleSignIn = () => {
  console.log('🔥 NEW initializeGoogleSignIn called');
};

console.log('🔥 NEW googleAuthNew.ts: Module loaded completely');
console.log('🔥 NEW Exports available:', {
  signInWithGoogle: typeof signInWithGoogle,
  signOut: typeof signOut,
  initializeGoogleSignIn: typeof initializeGoogleSignIn
});
