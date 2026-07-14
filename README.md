# LifeQuest

[Polska wersja](README.pl.md)

A local-first personal development dashboard for goals, weekly planning, daily actions, evidence-informed habits, progress reviews, and lightweight gamification.

## Current status

Version **0.9.0** is the current public release. LifeQuest runs entirely in the browser and does not require an account, backend, or cloud service. The source code is public, while goals, tasks, check-ins, notes, backups, and safety snapshots remain on the user's device.

![LifeQuest dashboard](docs/assets/lifequest-dashboard.png)

## What is LifeQuest?

LifeQuest turns goals, daily actions, evidence-informed habits, and check-ins into a structured progress dashboard. It covers areas such as energy, body, mind, focus, personal growth, finances, and relationships without automatically interpreting private notes.

## Features

- Directional and outcome goals with active, paused, and completed states.
- Weekly plans with one to three priorities, next steps, minimum versions, and obstacle plans.
- Automatic carry-over of unfinished priorities into the next week's draft.
- Weekly reviews based on completed steps without semantic analysis of private notes.
- One active 7- or 14-day development experiment created from a habit or weekly step.
- Full and minimum experiment variants, explicit skip reasons, and structural completion summaries.
- Daily tasks with XP rewards.
- Automatic daily planning based on goal steps and a light, normal, or intensive day mode.
- A professional habit library with concise source notes.
- Editing generated tasks before completion.
- Daily check-ins for sleep, energy, mood, and reflection.
- Progress views for day, week, month, three months, six months, and one year.
- Period KPIs including XP, completed tasks, and strongest and weakest development areas.
- Compact XP chart grouped by development area.
- Profile level, XP, check-in streak, and development areas.
- Manual task management and weekly reports.
- Versioned `lifequest-backup-YYYY-MM-DD-HHMMSS.json` backups with import preview.
- Daily, manual, pre-import, and pre-restore safety snapshots.
- Visible local-storage status, persistent-storage request, and storage-error alerts.

## Privacy and data safety

LifeQuest stores the active state in `localStorage` and keeps up to seven emergency snapshots in IndexedDB. Import displays a preview and does not replace active data until the user confirms the operation. Before replacing or restoring data, the application creates a safety snapshot of the current state.

Data version 4 covers goals, weekly plans, development experiments, and experiment reviews while preserving migrations for older saved states.

For synchronization through Syncthing, select a regular folder and save downloaded `lifequest-backup-*.json` files there. The browser cannot write directly to that folder without an explicit save action.

## Technology

- React for the user interface.
- TypeScript for typed domain data, tasks, check-ins, and summaries.
- Vite for the local development server and production builds.
- `localStorage` for the active application state.
- IndexedDB for up to seven local safety snapshots.
- Vitest for domain-logic tests.
- Playwright for end-to-end tests and application screenshots.
- lucide-react for interface icons.

There is no backend, user-account system, or cloud database.

## Local development

The easiest option on Windows is:

```powershell
.\start-lifequest.cmd
```

The script installs dependencies when `node_modules` is missing, starts the local development server, and opens the dashboard in the default browser.

Manual startup:

```powershell
npm install
npm run dev
```

Default local address:

```text
http://127.0.0.1:5173
```

## Verification

```powershell
npm test
npm run build
npm run e2e
```
