import { load } from "@tauri-apps/plugin-store";
import { writable } from "svelte/store";
import { DEFAULT_SETTINGS, type Settings } from "../types";

const STORE_PATH = "settings.json";
const storePromise = load(STORE_PATH, { autoSave: false, defaults: {} });

export const settings = writable<Settings>({ ...DEFAULT_SETTINGS });
export const settingsReady = writable(false);

export async function initSettings(): Promise<Settings> {
  const store = await storePromise;
  const loaded = await store.get<Partial<Settings>>("settings");
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...loaded,
  };
  settings.set(merged);
  settingsReady.set(true);
  return merged;
}

export async function saveSettings(next: Settings): Promise<void> {
  const store = await storePromise;
  await store.set("settings", next);
  await store.save();
  settings.set(next);
}

export async function resetSettings(): Promise<void> {
  await saveSettings({ ...DEFAULT_SETTINGS });
}
