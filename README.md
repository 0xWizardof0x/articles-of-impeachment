# Articles of Impeachment

A fictional political strategy game: build the case, count the votes, and beat the calendar.

## Play locally

Open `index.html` in a modern browser. No installation, build step, account, or backend is required.

To serve it over HTTP instead:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Gameplay

- Choose a language and a two-year **Hard** or four-year **Harder** campaign, read the quickstart, then press **Start the Session**. Selecting a mode does not start the clock.
- The gavel animates before play begins; reduced-motion preferences skip the animation.
- Browse **28 moves per phase in Hard** and **56 in Harder**: 84 and 168 phase-specific choices across the campaign. Harder includes every Hard move plus an equal number of additional moves.
- Playable moves come first in the carousel. Unavailable moves follow them, with the original order preserved within each group. Capital, days, and prerequisite changes update the order while retaining card focus and matching pagination dots.
- Every move has a success roll. Cards disclose the current success chance, progress rewards, support changes, failure losses, and any evidence cost. Higher support improves the odds; Harder applies an additional eight-percentage-point penalty before the probability bounds.
- Quiet preparation, research, coalition work, public outreach, pressure, gambles, and compromises provide different costs, durations, odds, and consequences. Failed moves still spend their full listed capital and days.
- Public support fluctuates after every move and every active-play calendar day, alongside monthly fatigue and events. The dashboard shows the latest net change. Paused and hidden-tab time never generates opinion shifts.
- At month end, capital regenerates first. Breakthroughs resolve next, then the separate blowback roll. **Every blowback sets current political capital to half, rounded down**, regardless of the adverse event type. Repeated blows can require skipping action opportunities and adjourning to rebuild capital.
- Every 12 seconds of active play consumes one session day. Moves also spend their listed days.
- The calendar pauses when you pause the game, hide the tab, or open a campaign dialog.
- Game state lives in the current page session; reloading starts over.

This is a fictional simulation, not legal advice or a factual account of an impeachment proceeding.

## Languages

English, Spanish, French, Korean, Persian, Hebrew, Simplified Chinese, and Japanese are included. The language picker is available in the opening brief and during play. It updates controls, move cards, historical feed entries, dates, and outcomes without resetting the campaign. Persian and Hebrew use right-to-left layouts and carousel navigation. Dates retain the Gregorian calendar because the game is set in the United States.

The selected language is remembered on this device when browser storage is available. Game progress is not saved on reload. All translations are bundled locally; no translation service or network request is needed.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Game interface and page structure |
| `styles.css` | Layout, theme, and responsive styles |
| `game.js` | Game rules, start flow, move carousel, and calendar clock |
| `i18n.js` | Language preference, message formatting, and text direction |
| `locales.js` | Seven translation catalogs keyed by English source messages |
| `tests/smoke.cjs` | Translation coverage, start-flow, and clock regression checks |

The initial import preserves the October 29, 2026 New Edition game, with its inline styles and script separated into files for editing.

## Validation

```sh
node --check game.js
node --check i18n.js
node --check locales.js
node tests/smoke.cjs
```

No Node dependencies are needed. For a browser smoke check, confirm 28/56 moves in the two modes, select a move, inspect the displayed odds and support change, and adjourn until a blowback logs the exact capital halving. Check both LTR and RTL carousel navigation and verify that Pause/Resume and hidden-tab behavior preserve the countdown and public support.

## Hosting

Serve the repository root with any static web host. Keep `index.html`, `styles.css`, `game.js`, `i18n.js`, and `locales.js` together.

Live game: <https://articles-of-impeachment-play.proudpeach18.chatgpt.site>
