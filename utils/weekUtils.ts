import { TimeEntry } from '../types';
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export function getMondayOfWeek(date: Date): Date {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  const daysUntilMonday = (dayOfWeek + 6) % 7;
  targetDate.setDate(targetDate.getDate() - daysUntilMonday);
  return targetDate;
}
export function generateWeekDates(selectedDate: Date): string[] {
  const mondayDate = getMondayOfWeek(selectedDate);
  return Array.from({ length: 5 }, (_, dayIndex) => {
    const currentDay = new Date(mondayDate);
    currentDay.setDate(mondayDate.getDate() + dayIndex);
    return currentDay.toISOString().slice(0, 10);
  });
}
export function createEmptyWeekEntries(weekDates: string[]): TimeEntry[] {
  return weekDates.map((date) => ({
    id: date,
    date,
    startTime: '',
    finishTime: '',
    lunchMinutes: 0,
    notes: '',
  }));
}
export function prepareWeekInputs(weekEntries: TimeEntry[]) {
  const lunchHourInputs = weekEntries.map((entry) =>
    entry.lunchMinutes ? (entry.lunchMinutes / 60).toString() : '',
  );
  const paidTimeOffInputs = weekEntries.map((entry) => {
    const ptoHours = (entry as any).paidTimeOffHours || (entry as any).ptoHours;
    return ptoHours !== undefined && ptoHours !== null && ptoHours !== '' ? String(ptoHours) : '';
  });
  return { lunchHourInputs, paidTimeOffInputs };
}
export function calculateWeekSummary(
  entries: TimeEntry[],
  paidTimeOffOverrides?: string[],
): string {
  let totalHours = 0;
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
    const entry = entries[entryIndex];
    let workedHours = 0;
    if (entry.startTime && entry.finishTime) {
      const startMinutes = parseTimeToMinutes(entry.startTime);
      const endMinutes = parseTimeToMinutes(entry.finishTime);
      const netMinutes = endMinutes - startMinutes - (entry.lunchMinutes || 0);
      workedHours = Math.max(0, netMinutes) / 60;
    }
    let paidTimeOffHours = 0;
    if (paidTimeOffOverrides) {
      const ptoValue = parseFloat(paidTimeOffOverrides[entryIndex] || '0');
      if (!isNaN(ptoValue)) paidTimeOffHours = ptoValue;
    } else {
      const entryPto = (entry as any).paidTimeOffHours || (entry as any).ptoHours;
      if (entryPto) {
        paidTimeOffHours = parseFloat(entryPto) || 0;
      }
    }
    totalHours += workedHours + paidTimeOffHours;
  }
  return totalHours.toFixed(2);
}
function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}
