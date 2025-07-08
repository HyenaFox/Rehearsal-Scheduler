import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function GoogleCallback() {
  useEffect(() => {
    // Extract the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
      return;
    }

    if (code) {
      // Send the authorization code to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          code: code
        }, window.location.origin);
      }
      window.close();
    } else {
      // No code or error - something went wrong
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No authorization code received'
        }, window.location.origin);
      }
      window.close();
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Processing Google Sign-In...</Text>
    </View>
  );
}
