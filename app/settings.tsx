import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { ThemeContext } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'theme_preference';

export default function SettingsScreen() {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';
  const backgroundColor = isDarkMode ? '#222' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#222';
  const thumbColor = isDarkMode ? '#fff' : '#222';
  const trackColorOptions = { false: '#ccc', true: '#444' };
  const handleDarkModeToggle = async (isDarkModeEnabled: boolean) => {
    setTheme(isDarkModeEnabled ? 'dark' : 'light');
    await AsyncStorage.setItem(THEME_KEY, isDarkModeEnabled ? 'dark' : 'light');
  };
  return (
    <View style={[styles.container, { backgroundColor }]}> 
      <Text style={[styles.title, { color: textColor }]}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={handleDarkModeToggle}
          thumbColor={thumbColor}
          trackColor={trackColorOptions}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 32 
  },
  settingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    width: '80%' 
  },
  settingLabel: { 
    fontSize: 18 
  },
});
