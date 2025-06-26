import { Stack } from "expo-router";
import AuthWrapper from './components/AuthWrapper';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AppProvider>
      </AuthWrapper>
    </AuthProvider>
  );
}
