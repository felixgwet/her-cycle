![LunaFlow banner](banner.png)

# LunaFlow

A caring period & fertility tracker — built as a single-user progressive web app that runs entirely in the browser.

**Live:** https://felixgwet.github.io/lunaflow/

## What it does

- **Cycle dashboard** — today's phase (menstrual / follicular / fertile / ovulation / luteal), cycle day, fertility level, energy level and mood guidance on one screen.
- **Cycle wheel** — a circular day-tracker with a needle marking today, coloured by stage.
- **Month calendar** — the full month colour-coded by phase, with flags on key days.
- **Smart alerts** — upcoming heads-ups for period start/end, fertile window opening, ovulation (day before + day of), emotionally sensitive days, and the lowest-fertility stretch of the cycle.
- **Editable cycle settings** — period start date, period length and cycle length, persisted in `localStorage`. Everything (predictions, alerts, wheel, calendar) recomputes from those three values.
- **Installable** — add-to-homescreen on iOS/Android; all data stays on the device.

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui components |
| Routing | React Router (`basename` for GitHub Pages subpath) |
| State | React hooks + `localStorage` persistence |
| Hosting | GitHub Pages (static, single-file build) |

## Key engineering bits

- **One source of truth for cycle math** (`src/lib/cycle.ts`): ovulation is estimated as `max(periodLength + 2, cycleLength − 14)` (standard luteal-phase approximation), and every other value — phase, fertility score, energy score, mood copy, alert dates — derives from it. The UI never hard-codes dates.
- **Date handling is timezone-safe**: cycle math works on calendar dates, so "cycle day 1" means the same thing in every timezone.
- **Single-file deploy**: `npm run build` inlines the JS+CSS bundle into one self-contained HTML file (`package_singlefile.py`), which is what GitHub Pages serves — zero external requests, works offline after first load.

## Run it locally

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build
python ../package_singlefile.py   # inlines dist/ into one HTML file
# commit the result as index.html on the gh-pages branch / main
```

## A note on how it was built

I designed and shipped this app myself, using an AI chat assistant (Kimi) as a pair-programming and documentation helper — for scaffolding boilerplate, rubber-ducking layout decisions and tightening copy. All architecture, cycle-domain logic, UI/UX decisions and every line of shipped code passed through my hands; the AI accelerated the typing, not the thinking.

## Privacy

No accounts, no backend, no analytics. Her cycle data never leaves the device.
