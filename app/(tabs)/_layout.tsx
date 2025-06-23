import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#6366f1',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '🎭 Actors',
          tabBarLabel: 'Actors',
        }}
      />
      <Tabs.Screen
        name="scenes"
        options={{
          title: '🎬 Scenes',
          tabBarLabel: 'Scenes',
        }}
      />
      <Tabs.Screen
        name="timeslots"
        options={{
          title: '⏰ Times',
          tabBarLabel: 'Times',
        }}
      />
      <Tabs.Screen
        name="rehearsals"
        options={{
          title: '📅 Shows',
          tabBarLabel: 'Shows',
        }}
      />
    </Tabs>
  );
}
