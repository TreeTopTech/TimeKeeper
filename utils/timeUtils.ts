import { TimeEntry } from '../types';

export function getWorkedHours(entry: TimeEntry): number {
  const [startH, startM] = entry.startTime.split(':').map(Number);
  const [endH, endM] = entry.finishTime.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  const totalMinutes = end - start - entry.lunchMinutes;
  return Math.max(0, totalMinutes / 60);
}

export function getWorkedMinutes(entry: TimeEntry): number {
  const [startH, startM] = entry.startTime.split(':').map(Number);
  const [endH, endM] = entry.finishTime.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  return Math.max(0, end - start - entry.lunchMinutes);
}

export function getTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, e) => sum + getWorkedHours(e), 0);
}

export function getEntriesForPeriod(entries: TimeEntry[], startDate: string, endDate: string): TimeEntry[] {
  return entries.filter((e) => e.date >= startDate && e.date <= endDate);
}

export function getPeriodDates(pattern: 'weekly' | 'fortnightly', refDate: string): { start: string; end: string } {
  const d = new Date(refDate);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - ((day + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + (pattern === 'weekly' ? 6 : 13));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
