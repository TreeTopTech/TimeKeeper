import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeEntry, Settings } from '../types';

const ENTRIES_KEY = 'time_entries';
const SETTINGS_KEY = 'settings';

export const Storage = {
  async getEntries(): Promise<TimeEntry[]> {
    const data = await AsyncStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  },
  async saveEntries(entries: TimeEntry[]): Promise<void> {
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  },
  async getSettings(): Promise<Settings | null> {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  },
  async saveSettings(settings: Settings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};
