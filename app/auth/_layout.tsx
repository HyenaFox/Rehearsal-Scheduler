import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="google/callback" options={{ headerShown: false }} />
    </Stack>
  );
}
