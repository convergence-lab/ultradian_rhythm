import { get, writable } from "svelte/store";
import { createSession, finishSession } from "../db";
import { notifyPhaseChange, notifyPhaseComplete } from "../notify";
import type { Phase, TimerState } from "../types";
import { settings } from "./settings";

const initialState = (): TimerState => ({
  phase: "idle",
  remainingSeconds: 0,
  totalSeconds: 0,
  startedAt: null,
  isRunning: false,
  currentSessionId: null,
  energyBefore: null,
  pausedAt: null,
  totalPausedMs: 0,
});

function getSessionPausedMs(state: TimerState): number {
  let total = state.totalPausedMs;
  if (state.pausedAt) {
    total += Date.now() - new Date(state.pausedAt).getTime();
  }
  return total;
}

export const timer = writable<TimerState>(initialState());

let tickInterval: ReturnType<typeof setInterval> | null = null;
let isTransitioning = false;
const listeners = new Set<() => void>();

export function onSessionsChanged(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emitSessionsChanged(): void {
  listeners.forEach((callback) => callback());
}

function stopTick(): void {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function startTick(): void {
  stopTick();
  tickInterval = setInterval(() => {
    const state = get(timer);
    if (!state.isRunning || state.remainingSeconds <= 0) return;

    const remainingSeconds = state.remainingSeconds - 1;
    if (remainingSeconds <= 0) {
      timer.update((current) => ({
        ...current,
        remainingSeconds: 0,
        isRunning: false,
      }));
      void completeCurrentPhase(true);
      return;
    }

    timer.update((current) => ({ ...current, remainingSeconds }));
  }, 1000);
}

async function beginPhase(
  phase: "activity" | "rest",
  energyBefore: number | null = null,
): Promise<void> {
  const currentSettings = get(settings);
  const plannedMinutes =
    phase === "activity"
      ? currentSettings.activityMinutes
      : currentSettings.restMinutes;
  const totalSeconds = plannedMinutes * 60;
  const sessionId = await createSession(phase, plannedMinutes, energyBefore);

  timer.set({
    phase,
    remainingSeconds: totalSeconds,
    totalSeconds,
    startedAt: new Date().toISOString(),
    isRunning: true,
    currentSessionId: sessionId,
    energyBefore,
    pausedAt: null,
    totalPausedMs: 0,
  });

  await notifyPhaseChange(phase);
  startTick();
  emitSessionsChanged();
}

async function completeCurrentPhase(
  completed: boolean,
  metrics?: {
    energyAfter?: number | null;
    focusRating?: number | null;
    note?: string | null;
  },
): Promise<void> {
  if (isTransitioning) return;

  const state = get(timer);
  if (state.phase === "idle" || state.currentSessionId === null) return;

  isTransitioning = true;
  stopTick();

  try {
    const kind = state.phase as "activity" | "rest";
    const wasCompleted = completed && state.remainingSeconds <= 0;

    await finishSession(
      state.currentSessionId,
      wasCompleted,
      getSessionPausedMs(state),
      metrics?.energyAfter ?? null,
      metrics?.focusRating ?? null,
      metrics?.note ?? null,
    );
    await notifyPhaseComplete(kind);

    const currentSettings = get(settings);

    if (kind === "activity") {
      await beginPhase("rest");
      return;
    }

    if (currentSettings.autoStart) {
      await beginPhase("activity", metrics?.energyAfter ?? null);
      return;
    }

    timer.set(initialState());
    await notifyPhaseChange("idle");
    emitSessionsChanged();
  } finally {
    isTransitioning = false;
  }
}

export async function startActivity(energyBefore: number | null = null): Promise<void> {
  const state = get(timer);
  if (state.phase !== "idle" || isTransitioning) return;
  await beginPhase("activity", energyBefore);
}

export function pause(): void {
  const state = get(timer);
  if (state.phase === "idle" || !state.isRunning || state.pausedAt) return;
  stopTick();
  timer.update((current) => ({
    ...current,
    isRunning: false,
    pausedAt: new Date().toISOString(),
  }));
}

export function resume(): void {
  const state = get(timer);
  if (state.phase === "idle" || state.isRunning || state.remainingSeconds <= 0) {
    return;
  }
  timer.update((current) => {
    const additionalPause = current.pausedAt
      ? Date.now() - new Date(current.pausedAt).getTime()
      : 0;
    return {
      ...current,
      isRunning: true,
      pausedAt: null,
      totalPausedMs: current.totalPausedMs + additionalPause,
    };
  });
  startTick();
}

export async function skipCurrentPhase(): Promise<void> {
  const state = get(timer);
  if (state.phase === "idle" || isTransitioning) return;
  await completeCurrentPhase(false);
}

export async function resetTimer(): Promise<void> {
  const state = get(timer);
  if (state.phase !== "idle" && state.currentSessionId !== null) {
    await finishSession(state.currentSessionId, false, getSessionPausedMs(state));
    emitSessionsChanged();
  }
  stopTick();
  isTransitioning = false;
  timer.set(initialState());
}

export function setEnergyBefore(value: number | null): void {
  timer.update((current) => ({ ...current, energyBefore: value }));
}

export function getProgress(state: TimerState): number {
  if (state.totalSeconds <= 0) return 0;
  return 1 - state.remainingSeconds / state.totalSeconds;
}

export function phaseColor(phase: Phase): string {
  switch (phase) {
    case "activity":
      return "var(--color-activity)";
    case "rest":
      return "var(--color-rest)";
    default:
      return "var(--color-idle)";
  }
}

export function destroyTimer(): void {
  stopTick();
  listeners.clear();
}
