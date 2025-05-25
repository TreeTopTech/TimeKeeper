import { TimeEntry } from '../types';
export function calculateWorkedHours(entry: TimeEntry): number {
  if (!entry.startTime || !entry.finishTime) return 0;
  const startMinutes = parseTimeToMinutes(entry.startTime);
  const endMinutes = parseTimeToMinutes(entry.finishTime);
  const workedMinutes = endMinutes - startMinutes - entry.lunchMinutes;
  return Math.max(0, workedMinutes / 60);
}
export function calculateWorkedMinutes(entry: TimeEntry): number {
  if (!entry.startTime || !entry.finishTime) return 0;
  const startMinutes = parseTimeToMinutes(entry.startTime);
  const endMinutes = parseTimeToMinutes(entry.finishTime);
  return Math.max(0, endMinutes - startMinutes - entry.lunchMinutes);
}
export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => total + calculateWorkedHours(entry), 0);
}
export function filterEntriesForPeriod(
  entries: TimeEntry[],
  startDate: string,
  endDate: string,
): TimeEntry[] {
  return entries.filter((entry) => entry.date >= startDate && entry.date <= endDate);
}
export function calculatePeriodDates(
  pattern: 'weekly' | 'fortnightly',
  referenceDate: string,
): { start: string; end: string } {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
  const endDate = new Date(startDate);
  const daysToAdd = pattern === 'weekly' ? 6 : 13;
  endDate.setDate(startDate.getDate() + daysToAdd);
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
}
function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}
