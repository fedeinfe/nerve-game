import { mulberry32, hashString } from './rng.js';

export const TAU = Math.PI * 2;
export const CRACKS = 3;

// Costanti di bilanciamento, scelte con test/tune.mjs su 2500 corse simulate per profilo:
// principiante 31s mediani, medio 39s, esperto 73s (p90 118s). La finestra d'oro è espressa in
// TEMPO, non in larghezza: sotto gli ~85 ms nessuno può più anticiparla e il gioco smette di essere leale.
const BAL = {
  safeStart: 0.34,
  goldMin: 0.60,
  goldJitter: 0.18,
  goldWidth0: 0.190,
  goldWidthDecay: 0.0048,
  goldWidthFloor: 0.095,
  rate0: 0.55,
  rateGrowth: 0.033,
  rateCap: 1.10,
  base: 100,
  goldMult: 3,
  safeMult: 1,
  flinchMult: 0.4,
};

export function roundSpec(n, rnd) {
  const rate = Math.min(BAL.rateCap, BAL.rate0 + n * BAL.rateGrowth);
  const width = Math.max(BAL.goldWidthFloor, BAL.goldWidth0 - n * BAL.goldWidthDecay);
  const goldStart = BAL.goldMin + rnd() * BAL.goldJitter;
  return {
    rate,
    safeStart: BAL.safeStart,
    goldStart,
    goldEnd: goldStart + width,
    windowMs: Math.round((width / rate) * 1000),
  };
}

export function judge(charge, spec) {
  if (charge > spec.goldEnd) return 'overload';
  if (charge >= spec.goldStart) return 'gold';
  if (charge >= spec.safeStart) return 'safe';
  return 'flinch';
}

export function scoreFor(verdict, charge, chain) {
  const mult = verdict === 'gold' ? BAL.goldMult : verdict === 'safe' ? BAL.safeMult : verdict === 'flinch' ? BAL.flinchMult : 0;
  return Math.round(BAL.base * charge * mult * chain);
}

export function createRun({ seed, mode, now = 0 }) {
  const rnd = mulberry32(hashString(String(seed)));
  const state = {
    mode,
    seed,
    round: 0,
    score: 0,
    chain: 1,
    bestChain: 1,
    golds: 0,
    cracks: 0,
    charge: 0,
    holding: false,
    over: false,
    tape: [],
    spec: null,
    lastWindowMs: 0,
  };
  state.spec = roundSpec(0, rnd);
  let holdStart = 0;

  function nextRound() {
    state.round += 1;
    state.charge = 0;
    state.holding = false;
    state.spec = roundSpec(state.round, rnd);
  }

  // La carica è una funzione dell'orologio, non del numero di frame disegnati:
  // su un telefono che perde frame il verdetto resta quello che il giocatore ha davvero sentito.
  function chargeAt(t) {
    return Math.max(0, (t - holdStart) / 1000) * state.spec.rate;
  }

  function resolve(verdict, rawCharge) {
    const charge = Math.min(rawCharge, state.spec.goldEnd);
    const gained = scoreFor(verdict, charge, state.chain);
    state.lastWindowMs = state.spec.windowMs;
    state.holding = false;
    state.charge = charge;

    if (verdict === 'overload') {
      state.cracks += 1;
      state.chain = 1;
      state.tape.push('x');
    } else {
      state.score += gained;
      if (verdict === 'gold') {
        state.golds += 1;
        state.chain += 1;
        state.bestChain = Math.max(state.bestChain, state.chain);
        state.tape.push('g');
      } else {
        state.chain = 1;
        state.tape.push('s');
      }
    }

    const event = {
      verdict,
      gained,
      charge,
      chain: state.chain,
      round: state.round,
      windowMs: state.spec.windowMs,
    };

    if (state.cracks >= CRACKS) {
      state.over = true;
      state.charge = 0;
      event.over = true;
    } else {
      nextRound();
    }
    return event;
  }

  return {
    state,

    press(t) {
      if (state.over || state.holding) return;
      state.holding = true;
      holdStart = t;
      state.charge = 0;
    },

    // Aggiorna la carica dall'orologio e chiude il round se ha sfondato il muro.
    tick(t) {
      if (state.over || !state.holding) return null;
      const c = chargeAt(t);
      state.charge = c;
      if (c > state.spec.goldEnd) return resolve('overload', c);
      return null;
    },

    release(t) {
      if (state.over || !state.holding) return null;
      const c = chargeAt(t);
      return resolve(judge(c, state.spec), c);
    },

    // Annulla la presa senza penalità (es. ritorno da scheda in background).
    abort() {
      state.holding = false;
      state.charge = 0;
    },
  };
}
