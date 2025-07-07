import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
          backgroundColor: 'transparent',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '📅 Shows',
          tabBarLabel: 'Shows',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color: focused ? '#6366f1' : '#9ca3af' }}>📅</Text>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="rehearsals"
        options={{
          title: '🎭 Actors',
          tabBarLabel: 'Actors',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color: focused ? '#6366f1' : '#9ca3af' }}>🎭</Text>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="scenes"
        options={{
          title: '🎬 Scenes',
          tabBarLabel: 'Scenes',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color: focused ? '#6366f1' : '#9ca3af' }}>🎬</Text>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="timeslots"
        options={{
          title: '⏰ Times',
          tabBarLabel: 'Times',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color: focused ? '#6366f1' : '#9ca3af' }}>⏰</Text>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '👤 Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color: focused ? '#6366f1' : '#9ca3af' }}>👤</Text>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}
