import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4682B4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Rehearsal Scheduler' }} 
      />
      <Stack.Screen 
        name="add-actor" 
        options={{ title: 'Add Actor' }} 
      />
      <Stack.Screen 
        name="schedule-rehearsal" 
        options={{ title: 'Schedule Rehearsal' }} 
      />
      <Stack.Screen 
        name="add-timeslot" 
        options={{ title: 'Add Timeslot' }} 
      />
      <Stack.Screen 
        name="add-scene" 
        options={{ title: 'Add Scene' }} 
      />
    </Stack>
  );
}