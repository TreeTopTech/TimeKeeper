import { Storage } from '../storage/Storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeEntry, Settings } from '../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('Storage', () => {
  const entry: TimeEntry = {
    id: '1',
    date: '2025-05-19',
    startTime: '09:00',
    finishTime: '17:30',
    lunchMinutes: 60,
    notes: 'Test',
  };
  const settings: Settings = {
    workPattern: 'weekly',
    targetHours: 37.5,
    hourlyRate: 15,
  };

  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
  });

  it('saves and retrieves entries', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([entry]));
    const result = await Storage.getEntries();
    expect(result).toEqual([entry]);
    await Storage.saveEntries([entry]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('time_entries', JSON.stringify([entry]));
  });

  it('saves and retrieves settings', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(settings));
    const result = await Storage.getSettings();
    expect(result).toEqual(settings);
    await Storage.saveSettings(settings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('settings', JSON.stringify(settings));
  });
});
