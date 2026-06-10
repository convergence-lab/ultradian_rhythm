# Ultradian Rhythm

A cross-platform desktop app for managing ultradian rhythm cycles — alternating focused activity blocks (default 90 minutes) with restorative rest periods (default 20 minutes).

Built with **Tauri 2**, **Svelte 5**, and **TypeScript**.

## Features

- Circular timer with start, pause, resume, and skip controls
- Customizable activity and rest durations
- Automatic phase transitions with optional auto-start after rest
- Desktop notifications when phases begin and end
- SQLite session logging with focus, energy, and note tracking
- Daily SVG timeline and summary statistics

## Prerequisites

### Linux (Ubuntu / Mint)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev
```

Install Rust via [rustup](https://rustup.rs/).

### All platforms

See the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/).

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Project structure

- `src/` — SvelteKit frontend
- `src/lib/stores/` — timer and settings state
- `src/lib/components/` — UI components
- `src-tauri/` — Tauri Rust backend and SQLite migrations

## License

MIT
