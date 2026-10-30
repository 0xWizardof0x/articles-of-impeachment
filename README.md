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

- Choose a language and a two-year **Easy** or **Hard** campaign, or a four-year **Harder** campaign, read the quickstart, then press **Start the Session**. Selecting a mode does not start the clock.
- The gavel animates before play begins; reduced-motion preferences skip the animation.
- Browse **28 cards per phase in Easy and Hard** and **56 in Harder**: 84 and 168 phase-specific choices across the campaign. Harder includes every Hard move plus an equal number of additional moves.
- The **Deck** shows only cards affordable with current capital and days and with their prerequisites met. Unavailable cards fade and shrink out; remaining cards slide into the gaps. Cards return when resources recover. Playing a card resets the deck to its beginning; dots and accessible labels match the visible cards. Pausing keeps the deck visible. Reduced-motion preferences skip movement and exit animations.
- The play canvas puts a prominent live result feed above the Deck. It pairs the latest move outcome with its polling consequence, or shows the newest event with its context. A later daily opinion poll becomes its own headline. Successes, setbacks and milestones have distinct colors, impact stamps, light sweeps and particle bursts; blowback uses a stronger red impact and a **½** emblem. Resource changes pop and briefly float their signed deltas. Effects never consume game randomness, and re-renders or language changes do not replay them. Reduced-motion preferences remove animation while preserving every result. The calendar and header are condensed; campaign rules and full dispatches open in sheets that pause the clock. On mobile, the compact emoji-led **Bars of Burden** strip and larger feed sit above a shorter Deck, with only **Adjourn** beneath it at the bottom of the viewport. The core game fits a 375 × 667 portrait viewport at default text size; very small screens, landscape, or enlarged text can scroll instead of clipping controls.
- Cards have metallic frames, phase-colored ornamentation, large odds/reward numbers, a probability meter, distinct support/risk lines, and an illuminated gold **Play card** strip. Taller layouts display emblem artwork; small phones use a subtle watermark to preserve text space. Buttons have explicit borders, raised surfaces, hover/press feedback and visible keyboard focus. All original costs, risks and prerequisites remain visible, and gameplay rules are unchanged.
- The carousel centers one card, rotates neighboring cards with CSS 3D transforms, and supports native touch momentum, mouse drag, arrows, Home/End, and keyboard play. A side-card tap brings it forward; a centered-card tap plays it. Seven sliding pagination dots keep larger decks compact. No autoplay or WebGL dependency.
- Easy starts with 70 capital, 55 support and 12 evidence; regenerates 28–34 capital monthly; loses 1 support per month with no added fatigue; has 35% blowback and 40% breakthrough chances; and adds 10 percentage points to success odds (capped at 94%). Every blowback still halves capital. Easy has its own leaderboard.
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
| `styles.css` | Base theme, briefing and leaderboard styles |
| `experience.css` | Compact play canvas, 3D carousel and responsive burden bars |
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

No Node dependencies are needed. For a browser smoke check, confirm 28/28/56 moves in the three modes, select a move, inspect the displayed odds and support change, and adjourn until a blowback logs the exact capital halving. Check both LTR and RTL carousel navigation and verify that Pause/Resume and hidden-tab behavior preserve the countdown and public support.

## Hosting

Serve the repository root with any static web host. Keep the root HTML, CSS and JavaScript assets together, including `experience.css` and the leaderboard/localization assets.

Live game: <https://articles-of-impeachment-play.proudpeach18.chatgpt.site>

## Shared leaderboards

Enter a nickname (2–24 characters) and choose a country or territory before starting. After a campaign ends, **Post score** publishes the result. The leaderboard has **Overall** and **By country** views, separate Easy/Hard/Harder rankings, and the top 100 best results per browser identity and difficulty. Country names and leaderboard controls follow the selected language. Opening the board pauses the active-play clock.

Scores reward victory (10,000), evidence (10 each, capped at 75), House votes (10 each, capped at 218), Senate votes (30 each, capped at 67), support (10 each), capital (1 each), and, for wins only, remaining session days (5 each). The API calculates points; it never accepts a supplied score. These are casual, player-reported results, not server-replayed competitive records. Clearing browser cookies or changing devices creates a new identity. Names need not be unique.

Shared scores live in Sites D1, not localStorage. A one-year HttpOnly/SameSite cookie groups best results; only the public nickname, country, score, and result are returned by the API. Local storage remembers the player's name/country preference. Submissions are explicit, idempotent per run, origin-checked, size-limited, input-validated, and limited to 20 per browser per hour. This cookie-based limit is a casual-use safeguard, not strong abuse prevention.

### Full-stack development (Node 22.13+)

The buildless files at the repository root remain the canonical game source. `server/` contains the Sites Vinext/D1 server. Sync game assets after frontend changes:

```sh
node server/scripts/sync-game.mjs
cd server
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_furry_living_mummy.sql
npm run dev -- --hostname 127.0.0.1 --port 5189
```

Apply the migration only once to each new local database. Sites applies committed migrations during deployment; preview records are not deployed. The source manifest uses `d1: "DB"` and no static-only setting. The root URL redirects to `/play.html` to preserve the existing game HTML and scripts.

`node tests/smoke.cjs` covers game and translation behavior. With Node 22+ and a disposable local server running, `TEST_ORIGIN=http://127.0.0.1:5189 node tests/leaderboards.mjs` exercises D1 submission, best-score selection, retries, country filters, score validation, and privacy boundaries. It writes test scores to that local database only. Without `TEST_ORIGIN`, it runs pure validation tests.
