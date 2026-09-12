import { createRun, MODIFIERS, NEUTRAL } from '../src/game.js';

// Giocatore simulato: mira al centro dell'oro con un errore gaussiano sul tempo di rilascio.
// sigmaMs = precisione motoria. 55ms ~ giocatore medio, 30ms ~ esperto, 90ms ~ distratto.
function gauss(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function simulate({ sigmaMs, greed, seed, rand, mod = NEUTRAL }) {
  const run = createRun({ seed, mode: 'endless', modifier: mod });
  let t = 0, wall = 0;
  let guard = 0;
  while (!run.state.over && guard++ < 500) {
    const s = run.state.spec;
    // greed = probabilità di puntare all'oro invece di bancare in sicurezza
    const goForGold = rand() < greed;
    const targetCharge = goForGold
      ? (s.goldStart + s.goldEnd) / 2
      : (s.safeStart + s.goldStart) / 2;
    const idealMs = (targetCharge / s.rate) * 1000;
    const errMs = gauss(rand) * sigmaMs;
    const heldMs = Math.max(0, idealMs + errMs);
    run.press(t);
    const ev = run.tick(t + heldMs) || run.release(t + heldMs);
    wall += heldMs + 520; // tempo di reazione + pausa fra un round e l'altro
    t += heldMs + 520;
  }
  return { score: run.state.score, rounds: run.state.round, seconds: wall / 1000, bestChain: run.state.bestChain, golds: run.state.golds };
}

function mulberry(a) { return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const profiles = [
  { name: 'principiante  (σ=90ms, greed .55)', sigmaMs: 90, greed: 0.55 },
  { name: 'medio         (σ=55ms, greed .70)', sigmaMs: 55, greed: 0.70 },
  { name: 'esperto       (σ=30ms, greed .85)', sigmaMs: 30, greed: 0.85 },
  { name: 'prudente      (σ=55ms, greed .25)', sigmaMs: 55, greed: 0.25 },
];

const pct = (arr, p) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length * p)];

const MOD = process.argv[2] ? [NEUTRAL, ...MODIFIERS].find(m => m.key === process.argv[2]) : NEUTRAL;
console.log('== modificatore:', MOD.name, '==');
console.log('profilo                              durata mediana   p10–p90        round  punteggio med.  catena max');
for (const pr of profiles) {
  const rand = mulberry(12345);
  const runs = [];
  for (let i = 0; i < 3000; i++) runs.push(simulate({ ...pr, seed: 'sim-' + i, rand, mod: MOD }));
  const secs = runs.map(r => r.seconds);
  const scores = runs.map(r => r.score);
  const chains = runs.map(r => r.bestChain);
  console.log(
    pr.name.padEnd(36),
    (pct(secs, .5).toFixed(0) + 's').padStart(9),
    (pct(secs, .1).toFixed(0) + '–' + pct(secs, .9).toFixed(0) + 's').padStart(14),
    String(Math.round(runs.reduce((a, r) => a + r.rounds, 0) / runs.length)).padStart(7),
    String(pct(scores, .5).toLocaleString('en-US')).padStart(14),
    String(pct(chains, .9)).padStart(11)
  );
}
