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

- Choose a two-year **Hard** campaign or a four-year **Harder** campaign.
- Browse the move carousel to build evidence and political support.
- Every 12 seconds of active play consumes one session day. Moves also spend their listed days.
- The calendar pauses when you pause the game, hide the tab, or open a campaign dialog.
- Game state lives in the current page session; reloading starts over.

This is a fictional simulation, not legal advice or a factual account of an impeachment proceeding.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Game interface and page structure |
| `styles.css` | Layout, theme, and responsive styles |
| `game.js` | Game rules, rendering, move carousel, and calendar clock |

The initial import preserves the October 29, 2026 New Edition game, with its inline styles and script separated into files for editing.

## Validation

```sh
node --check game.js
```

No Node dependencies are needed. For a browser smoke check, start each campaign, select a move, use the carousel arrows, and verify that Pause/Resume and hidden-tab behavior preserve the day countdown.

## Hosting

Serve the repository root with any static web host. Keep `index.html`, `styles.css`, and `game.js` together. Creating this repository does not publish a live website.
