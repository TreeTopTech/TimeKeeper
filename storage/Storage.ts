import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeEntry, Settings } from '../types';
const ENTRIES_KEY = 'time_entries';
const SETTINGS_KEY = 'settings';
export const Storage = {
  async getEntries(): Promise<TimeEntry[]> {
    const json = await AsyncStorage.getItem(ENTRIES_KEY);
    return json ? JSON.parse(json) : [];
  },
  async saveEntries(entries: TimeEntry[]): Promise<void> {
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  },
  async getSettings(): Promise<Settings | null> {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    return json ? JSON.parse(json) : null;
  },
  async saveSettings(settings: Settings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};
