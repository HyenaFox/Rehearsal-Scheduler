import * as Haptics from 'expo-haptics';
import { Tabs, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isAdmin = user?.isAdmin;

  // Custom tab bar component
  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    // Define which tabs should be visible
    const visibleTabs = isAdmin 
      ? ['index', 'rehearsals', 'scenes', 'weekly-availability', 'profile']
      : ['index', 'weekly-availability', 'profile'];

    const tabConfigs: { [key: string]: { label: string; icon: string } } = {
      'index': { label: 'Shows', icon: '📅' },
      'rehearsals': { label: 'Actors', icon: '🎭' },
      'scenes': { label: 'Scenes', icon: '🎬' },
      'weekly-availability': { label: 'Weekly', icon: '🗓️' },
      'profile': { label: 'Profile', icon: '👤' }
    };

    return (
      <View style={customTabBarStyles.tabBar}>
        {visibleTabs.map((routeName, index) => {
          const isFocused = pathname === `/${routeName === 'index' ? '' : routeName}`;
          const config = tabConfigs[routeName];

          const onPress = () => {
            handleTabPress();
            const event = navigation.emit({
              type: 'tabPress',
              target: routeName,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(routeName);
            }
          };

          return (
            <TouchableOpacity
              key={routeName}
              onPress={onPress}
              style={customTabBarStyles.tabItem}
            >
              <Text style={[
                customTabBarStyles.tabIcon,
                { color: isFocused ? '#6366f1' : '#9ca3af' }
              ]}>
                {config.icon}
              </Text>
              <Text style={[
                customTabBarStyles.tabLabel,
                { color: isFocused ? '#6366f1' : '#9ca3af' }
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const customTabBarStyles = StyleSheet.create({
    tabBar: {
      backgroundColor: '#ffffff',
      borderTopWidth: 0,
      height: 85,
      paddingBottom: 10,
      paddingTop: 10,
      paddingHorizontal: 8,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    tabIcon: {
      fontSize: 24,
      marginTop: 4,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });

  return (
    <Tabs
      tabBar={CustomTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '📅 Shows',
        }}
      />
      <Tabs.Screen
        name="rehearsals"
        options={{
          title: '🎭 Actors',
        }}
      />
      <Tabs.Screen
        name="scenes"
        options={{
          title: '🎬 Scenes',
        }}
      />
      <Tabs.Screen
        name="weekly-availability"
        options={{
          title: '🗓️ Weekly',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '👤 Profile',
        }}
      />
    </Tabs>
  );
}
