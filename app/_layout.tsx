import React, { useEffect, useState, createContext } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export const ThemeContext = createContext({
  theme: 'light',
  setTheme: (themeValue: 'light' | 'dark') => {},
});
export default function ApplicationLayout() {
  const deviceColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    deviceColorScheme === 'dark' ? 'dark' : 'light',
  );
  useEffect(() => {
    setCurrentTheme(deviceColorScheme === 'dark' ? 'dark' : 'light');
  }, [deviceColorScheme]);
  const getTabBarIconName = (routeName: string): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'home':
        return 'home-outline';
      case 'settings':
        return 'settings-outline';
      default:
        return 'home-outline';
    }
  };
  const createTabBarIcon =
    (routeName: string) =>
    ({ color, size }: { color: string; size: number }) => {
      const iconName = getTabBarIconName(routeName);
      return <Ionicons name={iconName} size={size} color={color} />;
    };
  const createAddWeekTabIcon = ({ color, size }: { color: string; size: number }) => (
    <Ionicons name="add-circle-outline" size={size} color={color} />
  );
  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: setCurrentTheme }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: currentTheme === 'dark' ? '#fff' : '#000',
          tabBarStyle: { backgroundColor: currentTheme === 'dark' ? '#222' : '#fff' },
          tabBarIcon: createTabBarIcon(route.name),
        })}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        <Tabs.Screen
          name="new-week"
          options={{
            title: 'Add Week',
            tabBarIcon: createAddWeekTabIcon,
          }}
        />
        <Tabs.Screen name="edit-week" options={{ href: null }} />
      </Tabs>
    </ThemeContext.Provider>
  );
}
