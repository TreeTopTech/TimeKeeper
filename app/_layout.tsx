import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  const scheme = useColorScheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: scheme === 'dark' ? '#fff' : '#000',
        tabBarStyle: { backgroundColor: scheme === 'dark' ? '#222' : '#fff' },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'home') iconName = 'home-outline';
          else if (route.name === 'entries') iconName = 'list-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="entries" options={{ title: 'Entries' }} />
      <Tabs.Screen name="edit-week" options={{ href: null }} />
    </Tabs>
  );
}
