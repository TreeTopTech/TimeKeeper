import { TimeEntry } from '../types';

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getMinutesFromTimeString(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function getMondayOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

export function generateWeekDates(date: Date): string[] {
  const monday = getMondayOfWeek(date);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function createEmptyWeekEntries(dates: string[]): TimeEntry[] {
  return dates.map(date => ({
    id: date,
    date,
    startTime: '',
    finishTime: '',
    lunchMinutes: 0,
    notes: '',
  }));
}

export function prepareWeekInputs(entries: TimeEntry[]) {
  const lunchHourInputs = entries.map(entry => entry.lunchMinutes ? (entry.lunchMinutes / 60).toString() : '');
  const paidTimeOffInputs = entries.map(entry => {
    const pto = entry.paidTimeOffHours ?? entry.ptoHours;
    return pto !== undefined && pto !== null && pto !== '' ? String(pto) : '';
  });
  return { lunchHourInputs, paidTimeOffInputs };
}

export function calculateWeekSummary(entries: TimeEntry[], paidTimeOffOverrides?: string[]): string {
  let total = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let worked = 0;
    if (entry.startTime && entry.finishTime) {
      const start = getMinutesFromTimeString(entry.startTime);
      const end = getMinutesFromTimeString(entry.finishTime);
      const mins = end - start - (entry.lunchMinutes || 0);
      worked = Math.max(0, mins) / 60;
    }
    let pto = 0;
    if (paidTimeOffOverrides) {
      const val = parseFloat(paidTimeOffOverrides[i] || '0');
      if (!isNaN(val)) pto = val;
    } else {
      const entryPto = entry.paidTimeOffHours ?? entry.ptoHours;
      if (entryPto !== undefined && entryPto !== null && entryPto !== '') {
        pto = typeof entryPto === 'string' ? parseFloat(entryPto) : entryPto;
        if (isNaN(pto)) pto = 0;
      }
    }
    total += worked + pto;
  }
  return total.toFixed(2);
}
