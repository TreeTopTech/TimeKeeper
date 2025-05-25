export type WorkPattern = 'weekly' | 'fortnightly';
export interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  finishTime: string;
  lunchMinutes: number;
  notes?: string;
  tags?: string[];
  isAnnualLeave?: boolean;
  paidTimeOffHours?: number;
}
export interface Settings {
  workPattern: WorkPattern;
  targetHours: number;
  hourlyRate?: number;
}
export interface WeekSummary {
  mondayDate: string;
  dateRange: string;
  entries: TimeEntry[];
  totalHours: number;
}
export interface TimePicker {
  dayIndex: number;
  field: 'startTime' | 'finishTime' | null;
}
