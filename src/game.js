import { mulberry32, hashString } from './rng.js';

export const TAU = Math.PI * 2;
export const CRACKS = 3;
export const TAPE_MAX = 40;

// Oltre il limite il nastro scorre: tenere tutto farebbe crescere la schermata di fine
// oltre il viewport in una corsa lunga.
function push(tape, mark) {
  tape.push(mark);
  if (tape.length > TAPE_MAX) tape.shift();
}

// Costanti di bilanciamento, scelte con test/tune.mjs su 2500 corse simulate per profilo:
// principiante 31s mediani, medio 39s, esperto 73s (p90 118s). La finestra d'oro è espressa in
// TEMPO, non in larghezza: sotto gli ~85 ms nessuno può più anticiparla e il gioco smette di essere leale.
const BAL = {
  safeStart: 0.22,
  safeSqueeze: 0.0085,
  goldMin: 0.60,
  goldJitter: 0.18,
  goldWidth0: 0.190,
  goldWidthDecay: 0.0048,
  minWindowMs: 85,
  rate0: 0.55,
  rateGrowth: 0.033,
  rateCap: 1.10,
  base: 100,
  rateHardCap: 1.9,
  goldEndCeiling: 0.94,
  jitterGrowth: 0.0045,
  jitterMax: 0.30,
};


// Il modificatore del giorno è ciò che rende la corsa quotidiana una sfida davvero diversa,
// non lo stesso gioco con una banda spostata. Cambia il ritmo dell'anello, lo spessore
// dell'oro, quanto l'oro si sposta fra un round e l'altro, e quanto in fretta stringe.
// I moltiplicatori non devono cancellarsi: la finestra è width/rate, quindi moltiplicare
// entrambi per lo stesso fattore produce un modificatore che non si sente. Ogni voce qui
// ha un rapporto widthMul/rateMul distinto, ed è quello il numero che il giocatore percepisce.
export const MODIFIERS = [
  { key: 'steady',   name: 'STEADY',   blurb: 'Wide gold, patient ring.',     rateMul: 0.90, widthMul: 1.30, jitterMul: 0.7, growthMul: 0.85 },
  { key: 'tempo',    name: 'TEMPO',    blurb: 'Fast ring. Less time.',        rateMul: 1.32, widthMul: 1.10, jitterMul: 1.0, growthMul: 1.0 },
  { key: 'hairline', name: 'HAIRLINE', blurb: 'A slow ring, a thin seam.',    rateMul: 0.86, widthMul: 0.62, jitterMul: 0.9, growthMul: 0.9 },
  { key: 'drift',    name: 'DRIFT',    blurb: 'The gold will not sit still.', rateMul: 1.08, widthMul: 0.98, jitterMul: 2.2, growthMul: 1.0 },
  { key: 'surge',    name: 'SURGE',    blurb: 'Starts kind. Does not stay.',  rateMul: 0.90, widthMul: 1.22, jitterMul: 1.0, growthMul: 1.65 },
];

export const NEUTRAL = { key: 'endless', name: 'ENDLESS', blurb: '', rateMul: 1, widthMul: 1, jitterMul: 1, growthMul: 1 };

export function modifierFor(dayKey) {
  return MODIFIERS[hashString('mod-' + dayKey) % MODIFIERS.length];
}

export function roundSpec(n, rnd, mod = NEUTRAL) {
  const rate = Math.min(BAL.rateHardCap, (BAL.rate0 + n * BAL.rateGrowth * mod.growthMul) * mod.rateMul);
  // Il pavimento è sul TEMPO, non sulla larghezza dell'arco: una banda stretta su un anello
  // lento è leale, la stessa banda su un anello veloce non lo è. Legarlo al tempo lo garantisce
  // per costruzione su ogni modificatore, invece di sperare che i moltiplicatori si compensino.
  const minWidth = (BAL.minWindowMs / 1000) * rate;
  const width = Math.max(minWidth, (BAL.goldWidth0 - n * BAL.goldWidthDecay * mod.growthMul) * mod.widthMul);
  // La campata verde si stringe col passare dei round: senza questo esiste una linea
  // immortale (rilascia sempre a metà verde, non muori mai, la corsa non finisce).
  // Anche il verde ha però il pavimento di lealtà a 85 ms.
  const minSpan = (BAL.minWindowMs / 1000) * rate;
  const spread = Math.min(BAL.jitterMax, (BAL.goldJitter + n * BAL.jitterGrowth) * mod.jitterMul);
  // La banda non può mai oltrepassare il giro: oltre 1.0 l'arco si avvolge su se stesso,
  // la zona rossa non viene disegnata e l'oro finisce a coprire la zona di anticipo.
  const maxStart = Math.max(BAL.safeStart + 0.06, BAL.goldEndCeiling - width);
  const goldStart = Math.min(BAL.goldMin + rnd() * spread, maxStart);
  const safeStart = Math.min(
    BAL.safeStart + n * BAL.safeSqueeze * mod.growthMul,
    goldStart - minSpan
  );
  return {
    rate,
    safeStart,
    greenMs: Math.round(((goldStart - safeStart) / rate) * 1000),
    goldStart,
    goldEnd: Math.min(BAL.goldEndCeiling, goldStart + width),
    windowMs: Math.round((Math.min(BAL.goldEndCeiling, goldStart + width) - goldStart) / rate * 1000),
  };
}

// L'anello ha UNA sola campata sicura: [safeStart, goldEnd]. Mancarla in basso costa
// quanto sfondarla in alto. Senza questa simmetria il rilascio anticipato è gratis e
// una corsa può non finire mai.
export function judge(charge, spec) {
  if (charge > spec.goldEnd) return 'overload';
  if (charge >= spec.goldStart) return 'gold';
  if (charge >= spec.safeStart) return 'safe';
  return 'early';
}

// L'oro NON paga: fa crescere la catena, cioè la posta ancora da incassare.
// Il verde incassa quella posta al quadrato e la azzera. Il sovraccarico la brucia.
// È questo che rende la scelta reale: la soglia oltre la quale conviene incassare
// scende da ~75% a ~15% di rischio man mano che la catena cresce, e a un certo punto
// incrocia il rischio vero della finestra. Con la vecchia regola (oro = x3 x catena)
// conveniva incassare solo oltre il 70% di rischio, cioè mai: non c'era partita.
export function bankValue(charge, chain) {
  return Math.round(BAL.base * charge * chain * chain);
}

export function scoreFor(verdict, charge, chain) {
  if (verdict === 'safe') return bankValue(charge, chain);
  return 0; // l'oro accumula, non paga; anticipo e sovraccarico non danno nulla
}

export function createRun({ seed, mode, modifier = NEUTRAL }) {
  const rnd = mulberry32(hashString(String(seed)));
  const mod = modifier;
  const state = {
    mode,
    seed,
    modifier: mod,
    round: 0,
    score: 0,
    chain: 1,
    bestChain: 1,
    golds: 0,
    banked: 0,
    bestBank: 0,
    cracks: 0,
    charge: 0,
    holding: false,
    over: false,
    tape: [],
    spec: null,
    lastWindowMs: 0,
  };
  state.spec = roundSpec(0, rnd, mod);
  let holdStart = 0;

  function nextRound() {
    state.round += 1;
    state.charge = 0;
    state.holding = false;
    state.spec = roundSpec(state.round, rnd, mod);
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

    const failed = verdict === 'overload' || verdict === 'early';
    const lostPot = failed ? bankValue(state.spec.goldStart, state.chain) : 0;

    if (failed) {
      state.cracks += 1;
      state.chain = 1;
      push(state.tape, verdict === 'overload' ? 'x' : 'f');
    } else if (verdict === 'gold') {
      state.golds += 1;
      state.chain += 1;
      state.bestChain = Math.max(state.bestChain, state.chain);
      push(state.tape, 'g');
    } else {
      state.score += gained;
      state.banked += 1;
      state.bestBank = Math.max(state.bestBank, gained);
      state.chain = 1;
      push(state.tape, 's');
    }

    const event = {
      verdict,
      gained,
      charge,
      chain: state.chain,
      round: state.round,
      windowMs: state.spec.windowMs,
      lostPot,
      // Sfondare il muro per meno di 60ms merita un riconoscimento diverso da un errore grossolano.
      byAHair: (verdict === 'overload' && (rawCharge - state.spec.goldEnd) / state.spec.rate < 0.060)
        || (verdict === 'early' && (state.spec.safeStart - rawCharge) / state.spec.rate < 0.060),
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
