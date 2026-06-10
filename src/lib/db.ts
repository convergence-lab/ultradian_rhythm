import Database from "@tauri-apps/plugin-sql";
import type { DayStats, Session, SessionKind } from "./types";
import { endOfDayIso, startOfDayIso } from "./types";

let db: Database | null = null;

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
  energyAfter: number | null = null,
  focusRating: number | null = null,
  note: string | null = null,
): Promise<void> {
  const database = await getDb();
  await database.execute(
    `UPDATE sessions
     SET ended_at = $1, completed = $2, energy_after = $3, focus_rating = $4, note = $5
     WHERE id = $6`,
    [
      new Date().toISOString(),
      completed ? 1 : 0,
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
    `SELECT id, kind, started_at, ended_at, planned_minutes, completed,
            energy_before, energy_after, focus_rating, note
     FROM sessions
     ORDER BY started_at DESC
     LIMIT $1`,
    [limit],
  );
}

export async function getTodaySessions(): Promise<Session[]> {
  const database = await getDb();
  return database.select<Session[]>(
    `SELECT id, kind, started_at, ended_at, planned_minutes, completed,
            energy_before, energy_after, focus_rating, note
     FROM sessions
     WHERE started_at >= $1 AND started_at <= $2
     ORDER BY started_at ASC`,
    [startOfDayIso(), endOfDayIso()],
  );
}

export async function getDayStats(): Promise<DayStats> {
  const sessions = await getTodaySessions();
  const completedActivities = sessions.filter(
    (session) => session.kind === "activity" && session.completed === 1,
  );
  const focusRatings = completedActivities
    .map((session) => session.focus_rating)
    .filter((rating): rating is number => rating !== null);

  const totalFocusMinutes = completedActivities.reduce((total, session) => {
    if (session.ended_at) {
      const durationMs =
        new Date(session.ended_at).getTime() -
        new Date(session.started_at).getTime();
      return total + Math.round(durationMs / 60000);
    }
    return total + session.planned_minutes;
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
