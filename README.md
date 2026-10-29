# uwu-deck

<p align="center">
  <strong>A modular desktop productivity dashboard for Windows.</strong>
  <br />
  Tasks, notes, focus sessions, calendar events, system metrics, and music in one customizable workspace.
</p>

<p align="center">
  <img src="docs/screenshots/hero1.PNG" alt="uwu-deck desktop dashboard preview" width="900" />
  <img src="docs/screenshots/hero2.PNG" alt="uwu-deck desktop dashboard preview" width="900" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-555555?style=flat-square" alt="Platform: Windows 10 and 11" />
  <img src="https://img.shields.io/badge/Electron-Desktop%20App-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-Typed%20Code-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-8A7AAE?style=flat-square" alt="MIT License" />
</p>

---

## Overview

uwu-deck is a Windows desktop productivity application built with Electron, React, and TypeScript. It brings everyday productivity tools into a customizable dashboard, combining task management, quick notes, focus sessions, calendar events, system monitoring, and music playback in one application.

The project emphasizes modular UI components, local data persistence, a secure boundary between the Electron main process and renderer, and automated testing.

## Features

### Task Management

- Create, edit, complete, and delete tasks.
- Assign priorities and due dates.
- Filter tasks and track completion progress.
- Identify overdue tasks.

### Quick Notes

- Create, edit, search, pin, and delete notes.
- Automatically save edits with debouncing.
- Display the last-edited time.
- Confirm note deletion before removing it.

### Focus Timer

- Start, pause, resume, and reset focus sessions.
- Use configurable focus and break durations.
- Choose from 25/5, 50/10, and 90/15 presets.
- Track daily focus totals and session history.
- Receive desktop notifications, with an in-app fallback.

### Calendar

- View events in a monthly calendar.
- Highlight the current day and selected date.
- Create, edit, and delete events.
- Review upcoming events.

### System Monitor

- Display CPU and memory usage, system-drive disk information, and uptime.
- Retrieve system metrics through `systeminformation`.
- Represent unavailable measurements as unavailable rather than inventing values.

### Music

- Search YouTube and YouTube Music in the default browser.
- Save and manage validated music shortcuts.
- Reorder and remove shortcuts.
- Play local audio files with playback controls, seeking, volume adjustment, and playlist navigation.

YouTube playback takes place in the browser. The application does not directly control browser playback or display its track metadata.

### Desktop Integration

- Custom application title bar.
- System tray integration and hide-to-tray behavior.
- Global `Ctrl+Alt+D` shortcut to show or hide the application.
- Always-on-top option.
- Remember window size and position.
- Single-instance application behavior.

### Settings and Data Management

- Configure launch-at-login and tray behavior.
- Toggle always-on-top and reduced-motion settings.
- Configure timer defaults and system-monitor refresh intervals.
- Show, hide, and reorder dashboard widgets.
- Export and import application data as JSON.

## Technology Stack

| Technology | Purpose |
|---|---|
| Electron | Windows desktop runtime and operating-system integration |
| React 18 | Component-based user interface |
| TypeScript | Static typing across the application |
| Vite | Renderer development and bundling |
| electron-vite | Electron application development and build tooling |
| Node.js | Main-process runtime |
| systeminformation | System metrics |
| Vitest | Unit and logic testing |
| Playwright | End-to-end testing |
| electron-builder | Windows installer packaging |

## Architecture

The application separates operating-system integration, renderer communication, shared logic, and the React interface.

```text
uwu-deck/
|-- src/
|   |-- main/           # Electron main process, IPC, storage, system metrics
|   |-- preload/        # Secure API exposed to the renderer
|   |-- shared/         # Shared types and pure utility logic
|   `-- renderer/       # React interface, widgets, components, hooks, styles
|-- tests/              # Automated tests
|-- docs/
|   `-- screenshots/    # Application screenshots
|-- package.json
|-- package-lock.json
`-- README.md
```

### Main Process

The Electron main process manages the application window, tray, global shortcut, inter-process communication, persistent storage, and system metrics.

### Preload Layer

The preload script exposes a limited application API through `contextBridge`. The renderer uses `window.deck` instead of accessing Node.js or Electron APIs directly.

### Renderer

The React renderer contains the dashboard shell, individual widgets, reusable components, hooks, and styling.

### Shared Logic

Shared modules contain types and reusable logic that can be tested independently of the UI.

## Security

The application uses several Electron security measures:

- Context isolation enabled.
- Node integration disabled in the renderer.
- Sandbox enabled.
- A restrictive Content Security Policy.
- Navigation restrictions and denial of unapproved new windows.
- Validated IPC payloads and an allowlist of permitted data keys.
- IPC sender validation in the main process.
- External links restricted to approved HTTPS YouTube hosts.
- Notification permission granted only where required.

These controls reduce exposure between the renderer and the operating system. They should not be interpreted as a guarantee that the application is free from security vulnerabilities.

## Data Persistence

Application data is stored locally under:

```text
%APPDATA%\uwu-deck\data
```

The persistence layer uses separate JSON files for data types and includes schema versioning.

- Writes use a temporary file followed by a rename.
- Corrupted data files are backed up before the application falls back to empty data.
- Imports are validated before being applied.
- Pre-import data backups are retained in the `data\backups` directory.
- Debounced autosave reduces unnecessary writes, with pending changes flushed before normal application shutdown.

### Focus Timer Behavior

The timer tracks elapsed time using timestamps and accumulated milliseconds rather than relying only on interval ticks. A running session can account for elapsed wall-clock time while the application is closed. Paused sessions remain paused after restart, and sessions whose scheduled end time has passed can be marked completed.

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm.
- Git.
- Windows 10 or Windows 11 for the intended desktop environment.

### Installation

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Urwa2204/uwu-deck.git
cd uwu-deck
npm install
```

Start the development environment:

```bash
npm run dev
```

Available scripts depend on the current `package.json`. The following commands were used during project validation:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run dist
```

The distribution command builds the packaged Windows application and installer using the configured electron-builder setup.

## Testing

The project has been validated with the following checks:

| Check | Command |
|---|---|
| TypeScript | `npm run typecheck` |
| Linting | `npm run lint` |
| Unit tests | `npm test` |
| End-to-end tests | `npm run test:e2e` |
| Production build | `npm run build` |
| Windows packaging | `npm run dist` |

The previously recorded baseline passed 24 unit tests across six test files and five Playwright end-to-end tests. Re-run the commands against the current checkout to verify the present state.

## Known Limitations

- YouTube and YouTube Music open in the default browser; playback is not controlled by the application.
- Local audio file paths are specific to the current machine and are not portable through JSON export and import.
- Google Calendar synchronization is not implemented.
- CPU temperature monitoring is not currently provided.
- Unsigned Windows installers may trigger Microsoft SmartScreen warnings.

## Roadmap

Potential areas for future development include:

- Optional calendar provider integration.
- Improved data backup and recovery workflows.
- Additional dashboard customization.
- Expanded automated testing.
- Code signing and release automation for Windows.

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright (c) 2026 Urwa
