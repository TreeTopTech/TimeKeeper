import { TimeEntry } from '../types';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff));
}

export function getWeekDates(selectedDate: Date) {
  const monday = getMonday(selectedDate);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function buildEmptyWeek(weekDates: string[]): TimeEntry[] {
  return weekDates.map(date => ({
    id: date,
    date,
    startTime: '',
    finishTime: '',
    lunchMinutes: 0,
    notes: '',
  }));
}

export function getInitialInputs(week: TimeEntry[]) {
  const lunchInputs = week.map(e => e.lunchMinutes ? (e.lunchMinutes / 60).toString() : '');
  const ptoInputs = week.map(e => (e.ptoHours !== undefined && e.ptoHours !== null && e.ptoHours !== '') ? String(e.ptoHours) : '');
  return { lunchInputs, ptoInputs };
}

export function updateSummary(entries: TimeEntry[], ptoInputsOverride?: string[]): string {
  let total = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    let worked = 0;
    if (e.startTime && e.finishTime) {
      const [sh, sm] = e.startTime.split(':').map(Number);
      const [eh, em] = e.finishTime.split(':').map(Number);
      const mins = eh * 60 + em - (sh * 60 + sm) - (e.lunchMinutes || 0);
      worked = Math.max(0, mins) / 60;
    }
    let pto = 0;
    if (ptoInputsOverride) {
      const ptoStr = ptoInputsOverride[i];
      if (ptoStr && ptoStr !== '.' && ptoStr !== '') {
        const parsed = parseFloat(ptoStr);
        if (!isNaN(parsed)) pto = parsed;
      }
    } else if (e.ptoHours !== undefined && e.ptoHours !== null && e.ptoHours !== '') {
      pto = typeof e.ptoHours === 'string' ? parseFloat(e.ptoHours) : e.ptoHours;
    }
    total += worked + (pto || 0);
  }
  return `Total: ${total.toFixed(2)} hours`;
}
