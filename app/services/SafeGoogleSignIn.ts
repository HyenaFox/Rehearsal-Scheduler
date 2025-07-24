import { GoogleSignin } from '@react-native-google-signin/google-signin';

class SafeGoogleSignIn {
  private static isConfigured = false;
  private static isConfiguring = false;

  static async ensureConfigured(): Promise<boolean> {
    if (this.isConfigured) {
      return true;
    }

    if (this.isConfiguring) {
      // Wait for ongoing configuration
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.isConfigured;
    }

    this.isConfiguring = true;

    try {
      console.log('🔐 SafeGoogleSignIn: Ensuring Google Sign-In is configured...');
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      
      if (!webClientId) {
        console.error('🔐 SafeGoogleSignIn: ❌ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured');
        this.isConfiguring = false;
        return false;
      }
      
      console.log('🔐 SafeGoogleSignIn: Configuring with Client ID:', webClientId.substring(0, 20) + '...');
      
      GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      
      this.isConfigured = true;
      console.log('🔐 SafeGoogleSignIn: ✅ Google Sign-In configured successfully');
      return true;
    } catch (error) {
      console.error('🔐 SafeGoogleSignIn: ❌ Failed to configure Google Sign-In:', error);
      return false;
    } finally {
      this.isConfiguring = false;
    }
  }

  static async signIn() {
    const configured = await this.ensureConfigured();
    if (!configured) {
      throw new Error('Google Sign-In not configured');
    }
    return GoogleSignin.signIn();
  }

  static async signOut() {
    const configured = await this.ensureConfigured();
    if (!configured) {
      throw new Error('Google Sign-In not configured');
    }
    return GoogleSignin.signOut();
  }

  static async hasPreviousSignIn() {
    const configured = await this.ensureConfigured();
    if (!configured) {
      return false;
    }
    return GoogleSignin.hasPreviousSignIn();
  }

  static async getCurrentUser() {
    const configured = await this.ensureConfigured();
    if (!configured) {
      return null;
    }
    return GoogleSignin.getCurrentUser();
  }

  static isInitialized(): boolean {
    return this.isConfigured;
  }
}

export default SafeGoogleSignIn;
