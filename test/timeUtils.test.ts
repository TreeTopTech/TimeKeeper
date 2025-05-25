jest.unmock('../utils/timeUtils');
jest.unmock('../types');
import {
  calculateWorkedHours,
  calculateWorkedMinutes,
  calculateTotalHours,
  filterEntriesForPeriod,
  calculatePeriodDates,
} from '../utils/timeUtils';
import { TimeEntry } from '../types';
describe('timeUtils', () => {
  const sampleTimeEntry: TimeEntry = {
    id: '1',
    date: '2025-05-19',
    startTime: '09:00',
    finishTime: '17:30',
    lunchMinutes: 60,
    notes: 'Test',
  };
  it('calculates worked hours correctly', () => {
    expect(calculateWorkedHours(sampleTimeEntry)).toBeCloseTo(7.5);
  });
  it('calculates worked minutes correctly', () => {
    expect(calculateWorkedMinutes(sampleTimeEntry)).toBe(450);
  });
  it('calculates total hours for multiple entries', () => {
    const multipleEntries = [
      sampleTimeEntry,
      {
        ...sampleTimeEntry,
        id: '2',
        date: '2025-05-20',
        startTime: '10:00',
        finishTime: '18:00',
        lunchMinutes: 30,
      },
    ];
    expect(calculateTotalHours(multipleEntries)).toBeCloseTo(15);
  });
  it('filters entries for a period', () => {
    const entriesForTesting = [
      sampleTimeEntry,
      { ...sampleTimeEntry, id: '2', date: '2025-05-20' },
      { ...sampleTimeEntry, id: '3', date: '2025-05-30' },
    ];
    const filteredEntries = filterEntriesForPeriod(entriesForTesting, '2025-05-19', '2025-05-21');
    expect(filteredEntries.length).toBe(2);
  });
  it('gets correct period dates for weekly', () => {
    const { start, end } = calculatePeriodDates('weekly', '2025-05-21');
    expect(start).toBe('2025-05-19');
    expect(end).toBe('2025-05-25');
  });
  it('gets correct period dates for fortnightly', () => {
    const { start, end } = calculatePeriodDates('fortnightly', '2025-05-21');
    expect(start).toBe('2025-05-19');
    expect(end).toBe('2025-06-01');
  });
  it('handles entries with empty start time', () => {
    const entryWithEmptyStart = {
      ...sampleTimeEntry,
      startTime: '',
    };
    expect(calculateWorkedHours(entryWithEmptyStart)).toBe(0);
    expect(calculateWorkedMinutes(entryWithEmptyStart)).toBe(0);
  });
  it('handles entries with empty finish time', () => {
    const entryWithEmptyFinish = {
      ...sampleTimeEntry,
      finishTime: '',
    };
    expect(calculateWorkedHours(entryWithEmptyFinish)).toBe(0);
    expect(calculateWorkedMinutes(entryWithEmptyFinish)).toBe(0);
  });
  it('handles entries with negative work time (finish before start)', () => {
    const entryWithNegativeTime = {
      ...sampleTimeEntry,
      startTime: '18:00',
      finishTime: '09:00',
    };
    expect(calculateWorkedHours(entryWithNegativeTime)).toBe(0);
    expect(calculateWorkedMinutes(entryWithNegativeTime)).toBe(0);
  });
  it('handles entries with long lunch breaks that exceed work time', () => {
    const entryWithLongLunch = {
      ...sampleTimeEntry,
      startTime: '09:00',
      finishTime: '10:00',
      lunchMinutes: 120,
    };
    expect(calculateWorkedHours(entryWithLongLunch)).toBe(0);
    expect(calculateWorkedMinutes(entryWithLongLunch)).toBe(0);
  });
  it('calculates total hours with empty entries array', () => {
    expect(calculateTotalHours([])).toBe(0);
  });
  it('calculates total hours with mix of valid and invalid entries', () => {
    const mixedEntries = [
      sampleTimeEntry,
      {
        ...sampleTimeEntry,
        id: '2',
        startTime: '',
        finishTime: '17:00',
      },
      {
        ...sampleTimeEntry,
        id: '3',
        startTime: '10:00',
        finishTime: '15:00',
        lunchMinutes: 30,
      },
    ];
    expect(calculateTotalHours(mixedEntries)).toBeCloseTo(12);
  });
  it('filters entries with exact boundary dates', () => {
    const entriesForTesting = [
      { ...sampleTimeEntry, id: '1', date: '2025-05-19' },
      { ...sampleTimeEntry, id: '2', date: '2025-05-20' },
      { ...sampleTimeEntry, id: '3', date: '2025-05-21' },
      { ...sampleTimeEntry, id: '4', date: '2025-05-18' },
      { ...sampleTimeEntry, id: '5', date: '2025-05-22' },
    ];
    const filteredEntries = filterEntriesForPeriod(entriesForTesting, '2025-05-19', '2025-05-21');
    expect(filteredEntries.length).toBe(3);
    expect(filteredEntries.map((e) => e.id)).toEqual(['1', '2', '3']);
  });
  it('filters entries with empty array', () => {
    const filteredEntries = filterEntriesForPeriod([], '2025-05-19', '2025-05-21');
    expect(filteredEntries.length).toBe(0);
  });
  it('calculates period dates for different days of the week', () => {
    const sundayResult = calculatePeriodDates('weekly', '2025-05-25');
    expect(sundayResult.start).toBe('2025-05-19');
    expect(sundayResult.end).toBe('2025-05-25');
    const mondayResult = calculatePeriodDates('weekly', '2025-05-19');
    expect(mondayResult.start).toBe('2025-05-19');
    expect(mondayResult.end).toBe('2025-05-25');
    const fridayResult = calculatePeriodDates('weekly', '2025-05-23');
    expect(fridayResult.start).toBe('2025-05-19');
    expect(fridayResult.end).toBe('2025-05-25');
  });
  it('handles edge case time formats', () => {
    const entryWithEarlyTime = {
      ...sampleTimeEntry,
      startTime: '00:00',
      finishTime: '23:59',
      lunchMinutes: 0,
    };
    expect(calculateWorkedHours(entryWithEarlyTime)).toBeCloseTo(23.98, 1);
    expect(calculateWorkedMinutes(entryWithEarlyTime)).toBe(1439);
  });
});
