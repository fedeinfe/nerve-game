// Programmazione dinamica sulla vera roundSpec: qual e' la politica ottimale oro-vs-verde?
import { MODIFIERS, NEUTRAL, roundSpec, judge, scoreFor } from '../src/game.js';

const N = 400;        // orizzonte
const CMAX = 60;      // catena massima modellata
const GS = 21;        // griglia su goldStart
const ES = 481;       // griglia sull'errore

function specGrid(n, mod) {
  // roundSpec con rnd() sostituito da una griglia deterministica su [0,1)
  const out = [];
  for (let i = 0; i < GS; i++) {
    const u = (i + 0.5) / GS;
    out.push(roundSpec(n, () => u, mod));
  }
  return out;
}

function normPdf(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }

// distribuzione dei verdetti + punteggio atteso (per catena=1; scala lineare con la catena)
function outcome(spec, aim, sigmaMs) {
  const idealMs = (aim / spec.rate) * 1000;
  const lo = -5 * sigmaMs, hi = 5 * sigmaMs, h = (hi - lo) / (ES - 1);
  let wsum = 0;
  const p = { gold: 0, safe: 0, flinch: 0, overload: 0 };
  let sc = 0;
  for (let i = 0; i < ES; i++) {
    const err = lo + i * h;
    const w = normPdf(err / sigmaMs);
    wsum += w;
    const held = Math.max(0, idealMs + err);
    const charge = (held / 1000) * spec.rate;
    const v = judge(charge, spec);
    p[v] += w;
    sc += w * scoreFor(v, Math.min(charge, spec.goldEnd), 1);
  }
  for (const k of Object.keys(p)) p[k] /= wsum;
  return { p, score: sc / wsum };
}

function solve(sigmaMs, mod) {
  // V[k][c] indicizzato da round, all'indietro
  let V = [];                               // V[k][c] al round n+1
  for (let k = 0; k < 3; k++) V.push(new Float64Array(CMAX + 2));
  const policy = new Map();                 // "n|k|c" -> 'gold'|'safe'
  const evGap = new Map();
  for (let n = N - 1; n >= 0; n--) {
    const specs = specGrid(n, mod);
    const acts = specs.map((s) => ({
      gold: outcome(s, (s.goldStart + s.goldEnd) / 2, sigmaMs),
      safe: outcome(s, (s.safeStart + s.goldStart) / 2, sigmaMs),
    }));
    const Vn = [];
    for (let k = 0; k < 3; k++) Vn.push(new Float64Array(CMAX + 2));
    for (let k = 0; k < 3; k++) {
      for (let c = 1; c <= CMAX; c++) {
        let bestVal = -Infinity, bestA = null, vals = {};
        for (const a of ['gold', 'safe']) {
          let acc = 0;
          for (const o of acts) {
            const { p, score } = o[a];
            acc += score * c;
            const cUp = Math.min(CMAX, c + 1);
            acc += p.gold * V[k][cUp];
            acc += (p.safe + p.flinch) * V[k][1];
            if (k < 2) acc += p.overload * V[k + 1][1];
            // k==2: sovraccarico = fine corsa, valore 0
          }
          acc /= acts.length;
          vals[a] = acc;
          if (acc > bestVal) { bestVal = acc; bestA = a; }
        }
        Vn[k][c] = bestVal;
        policy.set(`${n}|${k}|${c}`, bestA);
        evGap.set(`${n}|${k}|${c}`, (vals.gold - vals.safe) / Math.max(1, Math.abs(vals.safe)));
      }
    }
    V = Vn;
  }
  return { policy, evGap, V };
}

for (const sigma of [30, 55, 90]) {
  const { policy, evGap } = solve(sigma, NEUTRAL);
  console.log(`\n===== sigma=${sigma}ms  (ENDLESS) — politica ottimale =====`);
  console.log('round  crepe  catena in cui conviene BANCARE invece che andare d oro');
  for (const n of [0, 5, 10, 20, 30, 60]) {
    for (const k of [0, 1, 2]) {
      let firstSafe = null;
      for (let c = 1; c <= 60; c++) if (policy.get(`${n}|${k}|${c}`) === 'safe') { firstSafe = c; break; }
      const g = evGap.get(`${n}|${k}|5`);
      console.log(`  ${String(n).padStart(3)}    ${k}     ${firstSafe === null ? 'MAI (oro sempre ottimale)' : 'catena >= ' + firstSafe}   | vantaggio EV oro-su-verde a catena 5: ${(g * 100).toFixed(0)}%`);
    }
  }
}
