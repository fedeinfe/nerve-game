# NERVE

A one-thumb arcade game for the browser. Hold to charge, release in the gold.
Runs from a link, no install, no account. A run lasts 30–120 seconds.

**Play:** https://fedeinfe.github.io/nerve-game/

## The rules

Hold anywhere — the ring charges clockwise. Release in the **green** to bank it safely.
Release in the **gold** for triple points and a longer chain. Hold into the **red** and it
overloads: that's a crack. Three cracks end the run.

Every bank makes the ring faster and the gold thinner. Banking green is safe, but it resets
your chain — which is the whole tension.

Two modes: a **daily run** and **endless**.

The daily run picks one of five modifiers from the UTC date — STEADY, TEMPO, HAIRLINE, DRIFT,
SURGE — and each one changes the actual shape of the run: how fast the ring charges, how thick
the gold starts, how far it moves between rounds, how quickly it tightens. Everyone in the
world gets the same modifier on the same day, so scores are comparable. Endless always runs the
neutral curve, so it stays a clean skill ladder.

## Running it

No build step, no dependencies. It's static files.

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321.

## Tests

```bash
node --test test/game.test.mjs
```

13 tests covering the scoring rules, the zone boundaries, the chain, the crack/game-over
flow, frame-independent timing, and the daily seed.

Two analysis scripts, not tests:

```bash
node test/balance.mjs   # simulated runs per skill profile
node test/tune.mjs      # parameter sweep behind the difficulty curve
```

## Why the charge is tied to the clock

In a precision game the verdict must never depend on how many frames were drawn. `press`,
`tick` and `release` all take a timestamp, and the charge is derived from elapsed
milliseconds. A phone that drops frames still judges the release the player actually felt.
(This also surfaced during QA: the automated browser used for testing throttles
`requestAnimationFrame` to ~1 fps while reporting the page as visible.)

## Difficulty

The gold window is expressed in **time**, not arc width — a thin band on a slow ring is fair,
the same band on a fast ring is not. The floor is 85 ms and it is derived from the ring's
current speed, so it holds by construction on every modifier rather than relying on the
multipliers happening to cancel out. A test checks all six curves.

Constants were chosen with `test/tune.mjs` over 2,500 simulated runs per skill profile:

| Profile | Median run | p10–p90 |
|---|---|---|
| Beginner (σ=90 ms) | 31 s | 22–46 s |
| Average (σ=55 ms) | 39 s | 28–56 s |
| Expert (σ=30 ms) | 73 s | 45–118 s |

## Layout

```
index.html        shell, screens, HUD
privacy.html      privacy notice
assets/style.css  design tokens and screens
src/game.js       rules, scoring, difficulty curve — no DOM, no canvas
src/render.js     canvas: ring, particles, shake, flash
src/main.js       wiring: input, screens, audio cues, share, persistence
src/loop.js       fixed-timestep loop, canvas fitting
src/rng.js        seeded PRNG, daily key
src/storage.js    localStorage with a memory fallback
src/audio.js      WebAudio synthesis — no audio files
src/analytics.js  aggregate event counters, dev traffic flagged
src/ads.js        ad slot abstraction — currently OFF
```

`src/game.js` has no browser dependency, which is why the rules are testable in Node.

## Advertising

**No ad network is active.** `src/ads.js` is a disabled abstraction: `showInterstitial`
and `showRewarded` resolve immediately with `{shown:false}` so the game works identically
with ads off, failed, or blocked. Nothing is loaded from an ad network and there is no
tracking script.

Before enabling anything, see `MONETIZATION.md` — the hosting terms matter: Vercel's Hobby
plan forbids ads outright, and GitHub Pages only names donations and crowdfunding as
permitted monetization.

## Deploy and rollback

Pushing to `main` publishes to GitHub Pages.

```bash
git push origin main
```

Rollback is a revert — the site is whatever `main` contains:

```bash
git revert <sha> && git push origin main
```

Tag known-good versions so there's always somewhere to go back to:

```bash
git tag -a v1.0.0 -m "..." && git push origin v1.0.0
```

## Licence

Code: MIT (see `LICENSE`). All visuals are generated in code — no third-party image, font
file, or audio asset is bundled. The typeface is Space Grotesk, served by Google Fonts
under the SIL Open Font Licence 1.1.
