import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { get } from "svelte/store";
import type { Phase } from "./types";
import { settings } from "./stores/settings";

let permissionGranted = false;

export async function initNotifications(): Promise<void> {
  permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }
}

export async function notifyPhaseChange(phase: Phase): Promise<void> {
  const currentSettings = get(settings);
  if (!currentSettings.notificationsEnabled) return;

  if (!permissionGranted) {
    await initNotifications();
  }
  if (!permissionGranted) return;

  const title =
    phase === "activity"
      ? "Activity session started"
      : phase === "rest"
        ? "Rest break started"
        : "Session complete";

  const body =
    phase === "activity"
      ? `Focus for ${currentSettings.activityMinutes} minutes.`
      : phase === "rest"
        ? `Rest for ${currentSettings.restMinutes} minutes.`
        : "Ready for the next ultradian cycle when you are.";

  sendNotification({ title, body });
}

export async function notifyPhaseComplete(kind: "activity" | "rest"): Promise<void> {
  const currentSettings = get(settings);
  if (!currentSettings.notificationsEnabled) return;

  if (!permissionGranted) {
    await initNotifications();
  }
  if (!permissionGranted) return;

  const title =
    kind === "activity" ? "Activity complete" : "Rest complete";
  const body =
    kind === "activity"
      ? "Great work. Time for a restorative break."
      : "Break finished. Start the next focus block when ready.";

  sendNotification({ title, body });
}
