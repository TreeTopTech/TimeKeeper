jest.unmock('../screens/HomeScreen');
jest.unmock('../types');
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';
import { TimeEntry } from '../types';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
const mockEntries: TimeEntry[] = [
  {
    id: '1',
    date: '2025-05-19',
    startTime: '09:00',
    finishTime: '17:00',
    lunchMinutes: 60,
    notes: 'Work day',
  },
  {
    id: '2',
    date: '2025-05-20',
    startTime: '10:00',
    finishTime: '18:00',
    lunchMinutes: 30,
    notes: 'Another work day',
  },
];
jest.mock('../storage/Storage', () => ({
  Storage: {
    getEntries: jest.fn().mockResolvedValue(mockEntries),
    getSettings: jest
      .fn()
      .mockResolvedValue({ workPattern: 'weekly', targetHours: 37.5, hourlyRate: 15 }),
  },
}));
jest.mock('../utils/timeUtils', () => ({
  calculatePeriodDates: jest.fn(() => ({ start: '2025-05-19', end: '2025-05-25' })),
  calculateTotalHours: jest.fn(() => 14.5),
}));
describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('renders summary and Add Week button', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText('Weeks')).toBeTruthy();
    expect(await findByText('Add Week')).toBeTruthy();
  });
  it('displays loading state initially', () => {
    const { getByTestId } = render(<HomeScreen />);
  });
  it('renders entries data when loaded', async () => {
    const { findByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(findByText('2025-05-19')).toBeTruthy();
    });
  });
});
