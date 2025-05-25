jest.unmock('../utils/weekUtils');
jest.unmock('../types');
import {
  WEEKDAY_LABELS,
  getMondayOfWeek,
  generateWeekDates,
  createEmptyWeekEntries,
  prepareWeekInputs,
  calculateWeekSummary,
} from '../utils/weekUtils';
import { TimeEntry } from '../types';
describe('weekUtils', () => {
  describe('WEEKDAY_LABELS', () => {
    it('should contain correct weekday labels', () => {
      expect(WEEKDAY_LABELS).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      expect(WEEKDAY_LABELS).toHaveLength(5);
    });
  });
  describe('getMondayOfWeek', () => {
    it('should return Monday when given a Monday', () => {
      const monday = new Date('2025-05-26');
      const result = getMondayOfWeek(monday);
      expect(result.getDay()).toBe(1);
      expect(result.toISOString().slice(0, 10)).toBe('2025-05-26');
    });
    it('should return Monday when given a Tuesday', () => {
      const tuesday = new Date('2025-05-27');
      const result = getMondayOfWeek(tuesday);
      expect(result.getDay()).toBe(1);
      expect(result.toISOString().slice(0, 10)).toBe('2025-05-26');
    });
    it('should return Monday when given a Wednesday', () => {
      const wednesday = new Date('2025-05-28');
      const result = getMondayOfWeek(wednesday);
      expect(result.getDay()).toBe(1);
      expect(result.toISOString().slice(0, 10)).toBe('2025-05-26');
    });
    it('should return Monday when given a Friday', () => {
      const friday = new Date('2025-05-30');
      const result = getMondayOfWeek(friday);
      expect(result.getDay()).toBe(1);
      expect(result.toISOString().slice(0, 10)).toBe('2025-05-26');
    });
    it('should return Monday when given a Sunday', () => {
      const sunday = new Date('2025-06-01');
      const result = getMondayOfWeek(sunday);
      expect(result.getDay()).toBe(1);
      expect(result.toISOString().slice(0, 10)).toBe('2025-05-26');
    });
    it('should handle different months correctly', () => {
      const dateInDecember = new Date('2025-12-31');
      const result = getMondayOfWeek(dateInDecember);
      expect(result.getDay()).toBe(1);
      expect(result.toISOString().slice(0, 10)).toBe('2025-12-29');
    });
  });
  describe('generateWeekDates', () => {
    it('should generate 5 consecutive weekday dates starting from Monday', () => {
      const wednesday = new Date('2025-05-28');
      const dates = generateWeekDates(wednesday);
      expect(dates).toHaveLength(5);
      expect(dates).toEqual(['2025-05-26', '2025-05-27', '2025-05-28', '2025-05-29', '2025-05-30']);
    });
    it('should handle month boundaries correctly', () => {
      const endOfMonth = new Date('2025-05-30');
      const dates = generateWeekDates(endOfMonth);
      expect(dates).toHaveLength(5);
      expect(dates).toEqual(['2025-05-26', '2025-05-27', '2025-05-28', '2025-05-29', '2025-05-30']);
    });
    it('should handle year boundaries correctly', () => {
      const newYear = new Date('2026-01-02');
      const dates = generateWeekDates(newYear);
      expect(dates).toHaveLength(5);
      expect(dates[0]).toBe('2025-12-29');
      expect(dates[4]).toBe('2026-01-02');
    });
  });
  describe('createEmptyWeekEntries', () => {
    it('should create empty time entries for given dates', () => {
      const weekDates = ['2025-05-26', '2025-05-27', '2025-05-28', '2025-05-29', '2025-05-30'];
      const entries = createEmptyWeekEntries(weekDates);
      expect(entries).toHaveLength(5);
      entries.forEach((entry, index) => {
        expect(entry).toMatchObject({
          id: weekDates[index],
          date: weekDates[index],
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
        });
      });
    });
    it('should handle empty array', () => {
      const entries = createEmptyWeekEntries([]);
      expect(entries).toEqual([]);
    });
    it('should create entries with unique IDs based on dates', () => {
      const weekDates = ['2025-05-26', '2025-05-27'];
      const entries = createEmptyWeekEntries(weekDates);
      expect(entries[0].id).toBe('2025-05-26');
      expect(entries[1].id).toBe('2025-05-27');
    });
  });
  describe('prepareWeekInputs', () => {
    it('should prepare lunch hour inputs from time entries', () => {
      const weekEntries: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
        },
        {
          id: '2',
          date: '2025-05-27',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 30,
          notes: '',
        },
      ];
      const result = prepareWeekInputs(weekEntries);
      expect(result.lunchHourInputs).toEqual(['1', '0.5']);
    });
    it('should handle entries with no lunch minutes', () => {
      const weekEntries: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 0,
          notes: '',
        },
      ];
      const result = prepareWeekInputs(weekEntries);
      expect(result.lunchHourInputs).toEqual(['']);
    });
    it('should prepare paid time off inputs from entries with paidTimeOffHours', () => {
      const weekEntries: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
          paidTimeOffHours: 8,
        },
        {
          id: '2',
          date: '2025-05-27',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
        },
      ];
      const result = prepareWeekInputs(weekEntries);
      expect(result.paidTimeOffInputs).toEqual(['8', '']);
    });
    it('should handle entries with ptoHours legacy field', () => {
      const weekEntries: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
          ptoHours: 4,
        },
      ];
      const result = prepareWeekInputs(weekEntries);
      expect(result.paidTimeOffInputs).toEqual(['4']);
    });
    it('should handle entries with undefined or null PTO values', () => {
      const weekEntries: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 0,
          notes: '',
          paidTimeOffHours: undefined,
        },
        {
          id: '2',
          date: '2025-05-27',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 0,
          notes: '',
          paidTimeOffHours: null as any, // Only for test, TS doesn't allow null
        },
      ];
      const result = prepareWeekInputs(weekEntries);
      expect(result.paidTimeOffInputs).toEqual(['', '']);
    });
  });
  describe('calculateWeekSummary', () => {
    const sampleEntries: TimeEntry[] = [
      {
        id: '1',
        date: '2025-05-26',
        startTime: '09:00',
        finishTime: '17:00',
        lunchMinutes: 60,
        notes: '',
      },
      {
        id: '2',
        date: '2025-05-27',
        startTime: '10:00',
        finishTime: '18:00',
        lunchMinutes: 30,
        notes: '',
      },
    ];
    it('should calculate total hours worked for the week', () => {
      const result = calculateWeekSummary(sampleEntries);
      expect(result).toBe('14.50');
    });
    it('should handle entries with no start or finish time', () => {
      const entriesWithEmpty: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
        },
        {
          id: '2',
          date: '2025-05-27',
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
        },
      ];
      const result = calculateWeekSummary(entriesWithEmpty);
      expect(result).toBe('7.00');
    });
    it('should include paid time off hours from overrides', () => {
      const ptoOverrides = ['0', '4'];
      const result = calculateWeekSummary(sampleEntries, ptoOverrides);
      expect(result).toBe('18.50');
    });
    it('should include paid time off hours from entry properties when no overrides', () => {
      const entriesWithPTO: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
          paidTimeOffHours: 2,
        },
        {
          id: '2',
          date: '2025-05-27',
          startTime: '',
          finishTime: '',
          lunchMinutes: 0,
          notes: '',
          paidTimeOffHours: 8,
        },
      ];
      const result = calculateWeekSummary(entriesWithPTO);
      expect(result).toBe('17.00');
    });
    it('should handle entries with ptoHours legacy field', () => {
      const entriesWithLegacyPTO: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
          ptoHours: 1.5,
        },
      ];
      const result = calculateWeekSummary(entriesWithLegacyPTO);
      expect(result).toBe('8.50');
    });
    it('should handle entries with legacy ptoHours property when no overrides', () => {
      const entriesWithLegacyPTO: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
          ptoHours: 2,
        },
        {
          id: '2',
          date: '2025-05-27',
          startTime: '10:00',
          finishTime: '18:00',
          lunchMinutes: 30,
          notes: '',
        },
      ];
      const result = calculateWeekSummary(entriesWithLegacyPTO);
      expect(result).toBe('16.50');
    });
    it('should handle entries with parseFloat error on PTO values', () => {
      const entriesWithInvalidPTO: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 60,
          notes: '',
          paidTimeOffHours: 'invalid',
        },
      ];
      const result = calculateWeekSummary(entriesWithInvalidPTO);
      expect(result).toBe('7.00');
    });
    it('should handle entries with zero lunchMinutes explicitly', () => {
      const entriesWithZeroLunch: TimeEntry[] = [
        {
          id: '1',
          date: '2025-05-26',
          startTime: '09:00',
          finishTime: '17:00',
          lunchMinutes: 0,
          notes: '',
        },
      ];
      const result = calculateWeekSummary(entriesWithZeroLunch);
      expect(result).toBe('8.00');
    });
  });
});
