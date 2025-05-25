import { getWorkedHours, getWorkedMinutes, getTotalHours, getEntriesForPeriod, getPeriodDates } from '../utils/timeUtils';
import { TimeEntry } from '../types';

describe('timeUtils', () => {
  const entry: TimeEntry = {
    id: '1',
    date: '2025-05-19',
    startTime: '09:00',
    finishTime: '17:30',
    lunchMinutes: 60,
    notes: 'Test',
  };

  it('calculates worked hours correctly', () => {
    expect(getWorkedHours(entry)).toBeCloseTo(7.5);
  });

  it('calculates worked minutes correctly', () => {
    expect(getWorkedMinutes(entry)).toBe(450);
  });

  it('calculates total hours for multiple entries', () => {
    const entries = [entry, { ...entry, id: '2', date: '2025-05-20', startTime: '10:00', finishTime: '18:00', lunchMinutes: 30 }];
    expect(getTotalHours(entries)).toBeCloseTo(15);
  });

  it('filters entries for a period', () => {
    const entries = [entry, { ...entry, id: '2', date: '2025-05-20' }, { ...entry, id: '3', date: '2025-05-30' }];
    const filtered = getEntriesForPeriod(entries, '2025-05-19', '2025-05-21');
    expect(filtered.length).toBe(2);
  });

  it('gets correct period dates for weekly', () => {
    const { start, end } = getPeriodDates('weekly', '2025-05-21');
    expect(start).toBe('2025-05-19');
    expect(end).toBe('2025-05-25');
  });
});
