import { TimeEntry } from '../types';

function getMinutesFromTimeString(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function calculateWorkedHours(entry: TimeEntry): number {
  if (!entry.startTime || !entry.finishTime) return 0;
  const start = getMinutesFromTimeString(entry.startTime);
  const end = getMinutesFromTimeString(entry.finishTime);
  const totalMinutes = end - start - entry.lunchMinutes;
  return Math.max(0, totalMinutes / 60);
}

export function calculateWorkedMinutes(entry: TimeEntry): number {
  if (!entry.startTime || !entry.finishTime) return 0;
  const start = getMinutesFromTimeString(entry.startTime);
  const end = getMinutesFromTimeString(entry.finishTime);
  return Math.max(0, end - start - entry.lunchMinutes);
}

export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + calculateWorkedHours(entry), 0);
}

export function filterEntriesForPeriod(entries: TimeEntry[], startDate: string, endDate: string): TimeEntry[] {
  return entries.filter(entry => entry.date >= startDate && entry.date <= endDate);
}

export function calculatePeriodDates(pattern: 'weekly' | 'fortnightly', referenceDate: string): { start: string; end: string } {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
  const end = new Date(monday);
  end.setDate(monday.getDate() + (pattern === 'weekly' ? 6 : 13));
  return {
    start: monday.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
