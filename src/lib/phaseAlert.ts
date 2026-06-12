import { isTauri } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { SessionKind } from "./types";

const FLASH_LABEL = "phase-flash";
const ALERT_LABEL = "phase-alert";

function overlayUrl(path: string, kind: SessionKind): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("kind", kind);
  return url.toString();
}

async function closeWindowIfExists(label: string): Promise<void> {
  try {
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      await existing.close();
    }
  } catch {
    // Window not found.
  }
}

export async function showDesktopFlash(kind: SessionKind): Promise<void> {
  if (!isTauri()) return;

  await closeWindowIfExists(FLASH_LABEL);

  const parent = WebviewWindow.getCurrent();
  const flash = new WebviewWindow(FLASH_LABEL, {
    parent,
    url: overlayUrl("/flash", kind),
    fullscreen: true,
    transparent: true,
    decorations: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focus: false,
    resizable: false,
  });

  void flash.once("tauri://error", (event) => {
    console.error("Flash overlay failed:", event);
  });
}

export async function showPhasePopup(kind: SessionKind): Promise<void> {
  if (!isTauri()) return;

  await closeWindowIfExists(ALERT_LABEL);

  const parent = WebviewWindow.getCurrent();
  const popup = new WebviewWindow(ALERT_LABEL, {
    parent,
    url: overlayUrl("/alert", kind),
    width: 440,
    height: 260,
    center: true,
    alwaysOnTop: true,
    resizable: false,
    decorations: false,
    title: "Ultradian Rhythm",
    focus: true,
  });

  return new Promise((resolve) => {
    void popup.once("tauri://destroyed", () => resolve());
    void popup.once("tauri://error", (event) => {
      console.error("Phase popup failed:", event);
      resolve();
    });
  });
}
