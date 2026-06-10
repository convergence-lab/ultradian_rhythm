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

Installers are generated under `src-tauri/target/release/bundle/`:

- `deb/` — Debian package (recommended on Linux Mint / Ubuntu)
- `appimage/` — portable AppImage (no install required)
- `rpm/` — RPM package

## Install (Linux)

### Option A: .deb (system install, recommended)

```bash
sudo dpkg -i "src-tauri/target/release/bundle/deb/Ultradian Rhythm_0.1.0_amd64.deb"
```

After install, launch **Ultradian Rhythm** from the application menu.

### Option B: AppImage (portable)

```bash
chmod +x "src-tauri/target/release/bundle/appimage/Ultradian Rhythm_0.1.0_amd64.AppImage"
./src-tauri/target/release/bundle/appimage/Ultradian\ Rhythm_0.1.0_amd64.AppImage
```

Copy the AppImage anywhere (e.g. `~/Applications/`) and run it directly.

## Project structure

- `src/` — SvelteKit frontend
- `src/lib/stores/` — timer and settings state
- `src/lib/components/` — UI components
- `src-tauri/` — Tauri Rust backend and SQLite migrations

## License

MIT
