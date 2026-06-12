import Database from "@tauri-apps/plugin-sql";
import type { DayStats, Session, SessionKind } from "./types";
import {
  computeDayStats,
  endOfDayIso,
  startOfDayIso,
} from "./types";

let db: Database | null = null;

const SESSION_COLUMNS = `id, kind, started_at, ended_at, planned_minutes, completed,
  paused_ms, energy_before, energy_after, focus_rating, note`;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:ultradian.db");
  }
  return db;
}

export async function createSession(
  kind: SessionKind,
  plannedMinutes: number,
  energyBefore: number | null = null,
): Promise<number> {
  const database = await getDb();
  const startedAt = new Date().toISOString();
  await database.execute(
    `INSERT INTO sessions (kind, started_at, planned_minutes, completed, energy_before)
     VALUES ($1, $2, $3, 0, $4)`,
    [kind, startedAt, plannedMinutes, energyBefore],
  );
  const rows = await database.select<{ id: number }[]>(
    "SELECT last_insert_rowid() as id",
  );
  return rows[0]?.id ?? 0;
}

export async function finishSession(
  sessionId: number,
  completed: boolean,
  pausedMs = 0,
  energyAfter: number | null = null,
  focusRating: number | null = null,
  note: string | null = null,
): Promise<void> {
  const database = await getDb();
  await database.execute(
    `UPDATE sessions
     SET ended_at = $1, completed = $2, paused_ms = $3, energy_after = $4, focus_rating = $5, note = $6
     WHERE id = $7`,
    [
      new Date().toISOString(),
      completed ? 1 : 0,
      pausedMs,
      energyAfter,
      focusRating,
      note,
      sessionId,
    ],
  );
}

export async function updateSessionMetrics(
  sessionId: number,
  fields: {
    energy_before?: number | null;
    energy_after?: number | null;
    focus_rating?: number | null;
    note?: string | null;
  },
): Promise<void> {
  const database = await getDb();
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("energy_before" in fields) {
    updates.push(`energy_before = $${updates.length + 1}`);
    values.push(fields.energy_before ?? null);
  }
  if ("energy_after" in fields) {
    updates.push(`energy_after = $${updates.length + 1}`);
    values.push(fields.energy_after ?? null);
  }
  if ("focus_rating" in fields) {
    updates.push(`focus_rating = $${updates.length + 1}`);
    values.push(fields.focus_rating ?? null);
  }
  if ("note" in fields) {
    updates.push(`note = $${updates.length + 1}`);
    values.push(fields.note ?? null);
  }

  if (updates.length === 0) return;

  values.push(sessionId);
  await database.execute(
    `UPDATE sessions SET ${updates.join(", ")} WHERE id = $${values.length}`,
    values,
  );
}

export async function getRecentSessions(limit = 20): Promise<Session[]> {
  const database = await getDb();
  return database.select<Session[]>(
    `SELECT ${SESSION_COLUMNS}
     FROM sessions
     ORDER BY started_at DESC
     LIMIT $1`,
    [limit],
  );
}

export async function getSessionsForDate(date: Date): Promise<Session[]> {
  const database = await getDb();
  return database.select<Session[]>(
    `SELECT ${SESSION_COLUMNS}
     FROM sessions
     WHERE started_at >= $1 AND started_at <= $2
     ORDER BY started_at ASC`,
    [startOfDayIso(date), endOfDayIso(date)],
  );
}

export async function getTodaySessions(): Promise<Session[]> {
  return getSessionsForDate(new Date());
}

export async function getDayStatsForDate(date: Date): Promise<DayStats> {
  const sessions = await getSessionsForDate(date);
  return computeDayStats(sessions);
}

export async function getDayStats(): Promise<DayStats> {
  return getDayStatsForDate(new Date());
}

export async function getSessionsForDateRange(
  start: Date,
  end: Date,
): Promise<Session[]> {
  const database = await getDb();
  return database.select<Session[]>(
    `SELECT ${SESSION_COLUMNS}
     FROM sessions
     WHERE started_at >= $1 AND started_at <= $2
     ORDER BY started_at ASC`,
    [startOfDayIso(start), endOfDayIso(end)],
  );
}

export async function getEarliestSessionDate(): Promise<Date | null> {
  const database = await getDb();
  const rows = await database.select<{ started_at: string }[]>(
    `SELECT started_at FROM sessions ORDER BY started_at ASC LIMIT 1`,
  );
  if (!rows[0]) return null;
  return new Date(rows[0].started_at);
}
