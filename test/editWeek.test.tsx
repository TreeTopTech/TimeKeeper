jest.unmock('../app/edit-week');
jest.unmock('../types');
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import EditWeekScreen from '../app/edit-week';
import { TimeEntry } from '../types';
const mockParams = {
  weekOf: '2025-05-19',
};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}));
const mockSaveEntries = jest.fn();
const mockGetEntries = jest.fn();
jest.mock('../storage/Storage', () => ({
  Storage: {
    getEntries: mockGetEntries.mockResolvedValue([]),
    saveEntries: mockSaveEntries,
  },
}));
describe('EditWeekScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('renders Edit Week title', async () => {
    const { findByText } = render(<EditWeekScreen />);
    expect(await findByText('Edit Week')).toBeTruthy();
  });
  it('loads existing entries for the week', async () => {
    const mockWeekEntries: TimeEntry[] = [
      {
        id: '1',
        date: '2025-05-19',
        startTime: '09:00',
        finishTime: '17:00',
        lunchMinutes: 60,
        notes: 'Monday work',
      },
    ];
    mockGetEntries.mockResolvedValueOnce(mockWeekEntries);
    const { findByText } = render(<EditWeekScreen />);
    await waitFor(() => {
      expect(mockGetEntries).toHaveBeenCalled();
    });
  });
  it('handles missing weekOf parameter', async () => {
    (require('expo-router').useLocalSearchParams as jest.Mock).mockReturnValueOnce({});
    const { findByText } = render(<EditWeekScreen />);
    expect(await findByText('Edit Week')).toBeTruthy();
  });
});
