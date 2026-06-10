export type Phase = "idle" | "activity" | "rest";
export type SessionKind = "activity" | "rest";

export interface Session {
  id: number;
  kind: SessionKind;
  started_at: string;
  ended_at: string | null;
  planned_minutes: number;
  completed: number;
  energy_before: number | null;
  energy_after: number | null;
  focus_rating: number | null;
  note: string | null;
}

export interface Settings {
  activityMinutes: number;
  restMinutes: number;
  autoStart: boolean;
  notificationsEnabled: boolean;
}

export interface DayStats {
  completedCycles: number;
  totalFocusMinutes: number;
  averageFocus: number | null;
}

export interface TimerState {
  phase: Phase;
  remainingSeconds: number;
  totalSeconds: number;
  startedAt: string | null;
  isRunning: boolean;
  currentSessionId: number | null;
  energyBefore: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  activityMinutes: 90,
  restMinutes: 20,
  autoStart: true,
  notificationsEnabled: true,
};

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "activity":
      return "Activity";
    case "rest":
      return "Rest";
    default:
      return "Ready";
  }
}

export function startOfDayIso(date = new Date()): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export function endOfDayIso(date = new Date()): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}
