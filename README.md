# uwu-deck

A modular Windows desktop productivity dashboard built with **Electron + React + TypeScript** (electron-vite).
Dark espresso / platinum / lavender glass UI, fully offline, no accounts.

## Features

| Widget | What works |
| --- | --- |
| Tasks | add (Enter), edit, delete, complete, prio rity, due date, filters, progress, overdue marker |
| Quick notes | create, inline edit, debounced autosave, search, pin, delete (2-click confirm), last-edited time |
| Focus timer | start / pause / resume / reset, focus + break, 25/5 · 50/10 · 90/15 presets, daily totals, history, desktop notification with in-app fallback |
| Calendar | month view, today + selected highlight, add / edit / delete events, upcoming list |
| System monitor | real CPU, RAM, disk (system drive), uptime via `systeminformation`; unavailable values are labelled, never invented |
| Music | search YouTube or YouTube Music in your default browser, saved shortcuts (validated hosts, edit, reorder, delete), plus a **local audio player** (play/pause, seek, volume, previous/next, playlist of files you pick; files are never copied) |
| Shell | custom title bar, tray icon, hide-to-tray, `Ctrl+Alt+D` show/hide, always-on-top option, remembered window size/position, single instance |
| Settings | launch at login, tray behaviour, always on top, reduced motion, timer defaults, monitor interval, widget show/hide/reorder, JSON export / import |

## Run it

Requirements: Windows 10/11, Node.js 20 LTS (18+ works), Git.

```powershell
npm install
npm run dev        # development with hot reload
npm run build      # production build into out/
npm run dist       # Windows installer (NSIS) into dist/
npm run typecheck
npm run lint
npm test          # unit + component tests (Vitest, React Testing Library)
npm run test:e2e  # builds, then drives the real Electron app with Playwright
```

Or run `scripts\setup-and-publish.ps1`, which does install, checks, build and (optionally) the GitHub push.

## Publish to GitHub manually

```powershell
git init -b main
git add -A
git commit -m "feat: initial uwu-deck dashboard"
gh repo create uwu-deck --public --source=. --push
# without gh: create an empty repo at github.com/new, then
# git remote add origin https://github.com/<you>/uwu-deck.git ; git push -u origin main
```

## Architecture

```
src/main/       Electron main process: window, tray, shortcut, IPC, JSON store, system metrics
src/preload/    contextBridge API (window.deck) – the only door between UI and main
src/shared/     Pure, tested logic used by both sides (URL rules, timer maths, API types)
src/renderer/   React UI: App shell, widgets/, components/, hooks.ts, types.ts, styles.css
tests/          Vitest unit tests (URL validation, timer correctness)
```

* **Security:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strict CSP, navigation locked, new windows denied, only whitelisted data keys over IPC, every payload validated in main, IPC senders checked, external links limited to https YouTube hosts, notification is the only permission granted.
* **Persistence:** one JSON file per data type in `%APPDATA%\uwu-deck\data`, schema-versioned, atomic writes (temp file + rename). A corrupt file is copied to `*.corrupt-<time>.bak` before falling back to empty. Imports validate everything first and keep a pre-import backup in `data\backups`. Autosave is debounced (300 ms) and flushed before quit.
* **Timer correctness:** state is timestamp-based (`accumulatedMs` + `now - startedAt`), so it does not drift and ignores paused time. Restart behaviour: a *paused* session stays paused with its elapsed time; a *running* session keeps counting on the wall clock while the app was closed, and is recorded as completed if its end time has passed.

## Animation and background

* Animations use the `motion` package (the engine behind Motion Primitives). `components/motion.tsx` holds an animated group and a per-word text effect that follow Motion Primitives' patterns, written without Tailwind. To use the official components instead, add Tailwind + shadcn, then run `npx motion-primitives@latest add text-effect` (see motion-primitives.com).
* Backgrounds: export an SVG from [Haikei](https://haikei.app) into `src/renderer/src/assets/backgrounds/` (see the README there). It is picked up automatically; otherwise the built-in `bg.svg` is used.
* The *Reduce motion* setting disables all Motion animations.

## Known limitations

* The music widget opens links in your browser. It cannot see or control playback, and does not show track info.
* Local audio list is machine-specific, so it is not part of JSON export/import. Playable formats depend on Chromium (mp3, wav, ogg, flac, m4a/aac, opus).
* No Google Calendar sync, no CPU temperature (shown as unavailable).
* Installer is unsigned, so Windows SmartScreen may warn on first run.

## Screenshots

Run the app, take screenshots, and save them in `docs/screenshots/`, then link them here.

## License

MIT
