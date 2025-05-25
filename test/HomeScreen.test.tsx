import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../storage/Storage', () => ({ Storage: { getEntries: jest.fn().mockResolvedValue([]) } }));
jest.mock('../utils/timeUtils', () => ({ getPeriodDates: jest.fn(() => ({ start: '2025-05-19', end: '2025-05-25' })), getTotalHours: jest.fn(() => 0) }));

describe('HomeScreen', () => {
  it('renders summary and Add Week button', async () => {
    const { findByText } = render(<HomeScreen />);
    expect(await findByText('Weeks')).toBeTruthy();
    expect(await findByText('Add Week')).toBeTruthy();
  });
});
