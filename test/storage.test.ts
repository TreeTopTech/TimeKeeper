jest.unmock('../storage/Storage');
jest.unmock('../types');
import { Storage } from '../storage/Storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeEntry, Settings } from '../types';
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));
describe('Storage', () => {
  const sampleTimeEntry: TimeEntry = {
    id: '1',
    date: '2025-05-19',
    startTime: '09:00',
    finishTime: '17:30',
    lunchMinutes: 60,
    notes: 'Test',
  };
  const sampleSettings: Settings = {
    workPattern: 'weekly',
    targetHours: 37.5,
    hourlyRate: 15,
  };
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('saves and retrieves entries', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([sampleTimeEntry]));
    const retrievedEntries = await Storage.getEntries();
    expect(retrievedEntries).toEqual([sampleTimeEntry]);
    await Storage.saveEntries([sampleTimeEntry]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'time_entries',
      JSON.stringify([sampleTimeEntry]),
    );
  });
  it('saves and retrieves settings', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(sampleSettings));
    const retrievedSettings = await Storage.getSettings();
    expect(retrievedSettings).toEqual(sampleSettings);
    await Storage.saveSettings(sampleSettings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('settings', JSON.stringify(sampleSettings));
  });
  it('returns empty array when no entries stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const retrievedEntries = await Storage.getEntries();
    expect(retrievedEntries).toEqual([]);
  });
  it('returns null when no settings stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const retrievedSettings = await Storage.getSettings();
    expect(retrievedSettings).toBeNull();
  });
  it('handles empty entries array', async () => {
    await Storage.saveEntries([]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('time_entries', JSON.stringify([]));
  });
});
