export type WorkPattern = 'weekly' | 'fortnightly';

export interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  finishTime: string;
  lunchMinutes: number;
  notes?: string;
  tags?: string[];
}

export interface Settings {
  workPattern: WorkPattern;
  targetHours: number;
  hourlyRate?: number;
}
