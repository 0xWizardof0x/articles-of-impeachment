# Articles of Impeachment: 100-game simulation

Tested the game shipped in Sites version 3. Exactly 100 completed games: 50 Hard and 50 Harder. No production scores were posted and no game rules changed.

## Method

The harness loads the actual `game.js` into a fresh, isolated Node VM for each game. It replaces DOM rendering with no-ops and uses mock DOM/timer interfaces. Gameplay functions, probabilities, resource spending, monthly events, phase transitions, victory/defeat rules and clock consumption remain active. The 12-second day clock advances by six seconds before each bot decision. The bot never pauses and considers all currently legal cards without extra navigation time.

The bot ranks legal moves by expected phase progress plus expected support change, divided by weighted capital/day cost. It puts more weight on support below 50%, especially below 35%. It adjusts for expected failure losses and progress beyond the current phase target. It adjourns when no affordable legal move remains or every candidate has nonpositive utility. It has no knowledge of future random draws. This is one heuristic strategy, not an optimal solver or a model of average human behavior.

An LCG supplies reproducible random draws: `state = (1664525 * state + 1013904223) mod 2^32`. The initial seed is `20261029 + i * 101` for i=1..50, reused across modes. Different mode behavior consumes different random streams, so these are not identical paired gameplay events. Full policy, source SHA-256 and source Git commit are recorded in `results.json`. Approximate confidence intervals describe sampling uncertainty under this policy, not human win rates.

Run from the repository root with Node 22.13+:

```sh
node analysis/simulate-100.cjs
```

This recreates `results.json` and `games.csv`. The analysis below and `summary.json` describe this particular batch.

## Results

| Metric | Hard | Harder |
|---|---:|---:|
| Games | 50 | 50 |
| Wins | 25 (50%) | 6 (12%) |
| Approximate 95% Wilson interval | 36.6–63.4% | 5.6–23.8% |
| Deadline losses | 25 | 22 |
| Public-support collapse losses | 0 | 22 |
| Reached House phase | 48 | 35 |
| Reached Senate phase | 44 | 26 |
| Average month of victory, winners only | 20.2 of 24 | 40.3 of 48 |
| Moves per game | 36.22 | 50.58 |
| Successful moves | 82.8% | 75.7% |
| Average manual adjournments | 16.94 | 36.22 |
| Average adjournments with no affordable move | 16.74 | 35.40 |
| Calendar days deliberately skipped, pooled | 34.4% | 46.9% |
| Average blowbacks | 12.88 | 29.82 |
| Average cumulative capital lost to blowback | 184.24 | 342.72 |
| Longest observed consecutive blowback streak | 11 months | 20 months |
| Unique phase-specific moves chosen | 15 of 84 | 17 of 168 |

## Findings

1. **Harder is substantially harsher for this policy, despite twice the calendar and cards.** Hard lost only to time limits. Harder lost 22 games to time and 22 to public-support collapse; 13 of the collapses happened before leaving investigation. Six wins show it is winnable for this policy, but the sample does not establish the best achievable win rate.
2. **Capital is the main immediate constraint.** Of 847 Hard adjournments, 837 followed a state with no affordable move. In Harder, 1,770 of 1,811 did. The bot deliberately skipped 34.4%/46.9% of elapsed calendar days. Every completed month still included at least one move; the pressure mostly caused early adjournment after spending capital, rather than whole idle months. Only 37 Harder adjournments were discretionary because available moves had nonpositive utility.
3. **Blowback's exact-halving rule held in all 2,135 occurrences.** Cumulative capital losses averaged 184/343 across a campaign, including regenerated capital lost later. Observed event rates were 644/1,056 (61.0%) for Hard and 1,491/1,914 (77.9%) for Harder, versus configured risks of 65%/80%. These are observed sample rates, not changes to configuration.
4. **Public support is dynamic and consequential in Harder.** Average per-game minimum and maximum support were 33.2%/81.2% in Hard and 14.0%/68.3% in Harder. Those are averages of each game's extremes, not global bounds. Across a Harder game, moves contributed +161.7 support points on average over time, monthly decay removed 119.1, events removed 44.0, and opinion polling contributed -1.9. Their cumulative net agrees with starting and ending support. Support-building actions are essential under this policy.
5. **Most of the expanded move pool is not used by this bot.** Hard's three most-used cards account for 54.1% of actions; Harder's three account for 64.8%. In Harder, “Explain the Paper Trail” alone accounts for 978/2,529 actions (38.7%). This indicates concentration under this strategy, not proof that all unchosen moves are useless. Cooldowns, situational bonuses, or diminishing returns are possible experiments to encourage variety.
6. **Hard's common finishing bottleneck is the Senate.** Of 25 Hard losses, 19 reached the Senate, four stopped in the House and two remained in investigation. Among 44 games reaching the Senate, 25 won. In Harder, 26 reached the Senate and six won; 16 Senate games timed out and four collapsed in support.

## Balance interpretation

The requested increase in difficulty is evident in this batch. The next useful balance experiment is to increase meaningful card variety and give players a deliberate capital-recovery move that spends days, while preserving blowback's halving rule. Increasing punishment again before testing those options could increase repetition and forced adjournment. These are hypotheses to test, not implemented changes or causal findings from this single cohort.

## Validation and limits

All 100 games reached a terminal state. Per-game action successes plus failures matched actions taken. Move days + clock days + manually skipped days matched elapsed calendar days. Every adverse event retained exactly `floor(capital_before / 2)`. The final score was calculated with the production leaderboard validator; scores were not submitted. Support accounting also reconciled for every game.

This run does not test browser interactions, network behavior, competitive-score tampering, new-player learning, other play styles, or optimized strategy. The bot knows the current card statistics and has no extra time penalty for searching the full deck. A six-second decision interval is a stated test assumption. Fifty games per mode provide an initial balance signal, not a precise universal win rate.
