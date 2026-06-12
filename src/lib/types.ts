export type Phase = "idle" | "activity" | "rest";
export type SessionKind = "activity" | "rest";

export interface Session {
  id: number;
  kind: SessionKind;
  started_at: string;
  ended_at: string | null;
  planned_minutes: number;
  completed: number;
  paused_ms: number;
  energy_before: number | null;
  energy_after: number | null;
  focus_rating: number | null;
  note: string | null;
}

export interface ActiveSessionTiming {
  activeSessionId: number | null;
  pausedAt: string | null;
  totalPausedMs: number;
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
  pausedAt: string | null;
  totalPausedMs: number;
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

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function sessionActiveDurationMs(
  session: Session,
  timing?: ActiveSessionTiming,
): number {
  const start = new Date(session.started_at).getTime();
  const isActive = timing?.activeSessionId === session.id && !session.ended_at;

  let wallEnd: number;
  let pausedMs = session.paused_ms ?? 0;

  if (session.ended_at) {
    wallEnd = new Date(session.ended_at).getTime();
  } else if (isActive && timing) {
    pausedMs = timing.totalPausedMs;
    wallEnd = timing.pausedAt
      ? new Date(timing.pausedAt).getTime()
      : Date.now();
  } else {
    return 0;
  }

  return Math.max(0, wallEnd - start - pausedMs);
}

export function sessionChartEndMs(
  session: Session,
  timing?: ActiveSessionTiming,
): number {
  const start = new Date(session.started_at).getTime();
  return start + sessionActiveDurationMs(session, timing);
}

export function computeDayStats(
  sessions: Session[],
  timing?: ActiveSessionTiming,
): DayStats {
  const completedActivities = sessions.filter(
    (session) => session.kind === "activity" && session.completed === 1,
  );
  const focusRatings = completedActivities
    .map((session) => session.focus_rating)
    .filter((rating): rating is number => rating !== null);

  const totalFocusMinutes = completedActivities.reduce((total, session) => {
    const durationMs = sessionActiveDurationMs(session, timing);
    return total + Math.round(durationMs / 60000);
  }, 0);

  const averageFocus =
    focusRatings.length > 0
      ? focusRatings.reduce((sum, rating) => sum + rating, 0) /
        focusRatings.length
      : null;

  const completedRests = sessions.filter(
    (session) => session.kind === "rest" && session.completed === 1,
  ).length;

  return {
    completedCycles: Math.min(completedActivities.length, completedRests),
    totalFocusMinutes,
    averageFocus,
  };
}
