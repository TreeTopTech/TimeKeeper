import React from 'react';
import { render } from '@testing-library/react-native';
import EditWeekScreen from '../app/edit-week';

jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({}) }));
jest.mock('../storage/Storage', () => ({ Storage: { getEntries: jest.fn().mockResolvedValue([]), saveEntries: jest.fn() } }));

describe('EditWeekScreen', () => {
  it('renders Edit Week title', async () => {
    const { findByText } = render(<EditWeekScreen />);
    expect(await findByText('Edit Week')).toBeTruthy();
  });
});
