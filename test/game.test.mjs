import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, judge, roundSpec, scoreFor, bankValue, CRACKS, TAPE_MAX, MODIFIERS, NEUTRAL, modifierFor } from '../src/game.js';
import { mulberry32, hashString, todayKey, dayNumber } from '../src/rng.js';

const seq = (seed) => mulberry32(hashString(seed));

// Rilascia esattamente alla carica voluta, calcolando l'istante dall'orologio.
function releaseAt(run, charge, t0 = 1000) {
  const spec = run.state.spec;
  run.press(t0);
  const t = t0 + (charge / spec.rate) * 1000;
  return run.release(t);
}

test('il seme determina la sequenza: stesso giorno, stessa sfida', () => {
  const a = [], b = [];
  const ra = seq('daily-2026-09-12'), rb = seq('daily-2026-09-12');
  for (let i = 0; i < 12; i++) { a.push(roundSpec(i, ra)); b.push(roundSpec(i, rb)); }
  assert.deepEqual(a, b);
  const rc = seq('daily-2026-09-13');
  assert.notDeepEqual(roundSpec(0, rc).goldStart, a[0].goldStart);
});

test('judge riconosce le quattro zone ai bordi', () => {
  const spec = { safeStart: 0.34, goldStart: 0.70, goldEnd: 0.85 };
  assert.equal(judge(0.00, spec), 'early');
  assert.equal(judge(0.3399, spec), 'early');
  assert.equal(judge(0.34, spec), 'safe');
  assert.equal(judge(0.6999, spec), 'safe');
  assert.equal(judge(0.70, spec), 'gold');
  assert.equal(judge(0.85, spec), 'gold');
  assert.equal(judge(0.8501, spec), 'overload');
});

test('l oro non paga, il verde incassa la catena al quadrato', () => {
  assert.equal(scoreFor('gold', 0.8, 5), 0, 'l oro accumula, non paga');
  assert.equal(scoreFor('overload', 0.8, 5), 0);
  assert.equal(scoreFor('safe', 0.8, 1), 80);
  assert.equal(scoreFor('safe', 0.8, 4), 1280, '80 * 4^2');
  assert.equal(scoreFor('early', 0.8, 9), 0, 'l anticipo non paga nulla');
});

test('la decisione incassa-o-rischia esiste davvero a ogni catena', () => {
  // Soglia di rischio oltre la quale conviene incassare: deve SCENDERE con la catena,
  // altrimenti "vai sempre d oro" domina e non c e partita.
  const threshold = (c) => {
    for (let p = 0; p <= 1.0001; p += 0.001) {
      if ((1 - p) * bankValue(0.5, c + 1) < bankValue(0.5, c)) return p;
    }
    return 1;
  };
  const t = [1, 2, 3, 5, 8, 12].map(threshold);
  for (let i = 1; i < t.length; i++) {
    assert.ok(t[i] < t[i - 1], `la soglia non scende fra catena ${i - 1} e ${i}`);
  }
  assert.ok(t[0] < 0.80, `a catena 1 la soglia è ${t[0]}: troppo alta, rischiare è sempre giusto`);
  assert.ok(t[t.length - 1] < 0.25, `a catena 12 la soglia è ${t[t.length - 1]}: ancora troppo alta`);
});

test('la banda d oro non oltrepassa mai il giro dell anello', () => {
  for (const mod of [NEUTRAL, ...MODIFIERS]) {
    const r = seq('ceiling-' + mod.key);
    for (let n = 0; n < 200; n++) {
      const s = roundSpec(n, r, mod);
      assert.ok(s.goldEnd <= 0.95, `${mod.name} round ${n}: goldEnd ${s.goldEnd}`);
      assert.ok(s.goldStart > s.safeStart, `${mod.name} round ${n}: l oro invade la zona di anticipo`);
      assert.ok(s.goldEnd > s.goldStart, `${mod.name} round ${n}: banda d oro vuota`);
    }
  }
});

test('il nastro non cresce senza limite', () => {
  const run = createRun({ seed: 'long', mode: 'endless' });
  let t = 0;
  for (let i = 0; i < TAPE_MAX + 25; i++) {
    const sp = run.state.spec;
    run.press(t);
    run.release(t + (((sp.safeStart + sp.goldStart) / 2) / sp.rate) * 1000);
    if (run.state.over) { run.state.over = false; run.state.cracks = 0; }
    t += 3000;
  }
  assert.equal(run.state.tape.length, TAPE_MAX);
});

test('la catena cresce sull oro e si azzera sulla banca sicura', () => {
  const run = createRun({ seed: 'test-chain', mode: 'endless' });
  let t = 0;
  for (let i = 0; i < 3; i++) {
    const s = run.state.spec;
    const mid = (s.goldStart + s.goldEnd) / 2;
    run.press(t);
    run.release(t + (mid / s.rate) * 1000);
    t += 5000;
  }
  assert.equal(run.state.chain, 4, 'tre ori consecutivi: catena a 4');
  assert.equal(run.state.golds, 3);
  assert.equal(run.state.score, 0, 'tre ori non hanno ancora pagato nulla');

  const s = run.state.spec;
  run.press(t);
  run.release(t + (((s.safeStart + s.goldStart) / 2) / s.rate) * 1000);
  assert.equal(run.state.chain, 1, 'la banca sicura azzera la catena');
  assert.equal(run.state.bestChain, 4, 'il massimo raggiunto resta registrato');
  assert.ok(run.state.score > 0, 'la banca incassa la posta accumulata dagli ori');
  assert.equal(run.state.banked, 1);
});

test('rilasciare troppo presto costa una crepa come sfondare il muro', () => {
  const run = createRun({ seed: 'early', mode: 'endless' });
  const s = run.state.spec;
  run.press(0);
  const ev = run.release(((s.safeStart - 0.05) / s.rate) * 1000);
  assert.equal(ev.verdict, 'early');
  assert.equal(ev.gained, 0);
  assert.equal(run.state.cracks, 1, 'l anticipo deve costare una crepa');
  assert.equal(run.state.chain, 1);
});

test('non esiste una linea immortale: la campata sicura si stringe', () => {
  const r = seq('immortal');
  const first = roundSpec(0, r, NEUTRAL);
  const later = roundSpec(40, r, NEUTRAL);
  const spanMs = (sp) => ((sp.goldEnd - sp.safeStart) / sp.rate) * 1000;
  assert.ok(spanMs(later) < spanMs(first) * 0.6,
    `campata: ${Math.round(spanMs(first))}ms -> ${Math.round(spanMs(later))}ms, non si stringe abbastanza`);
  // ...ma nemmeno il verde scende sotto la soglia di lealtà
  for (const mod of [NEUTRAL, ...MODIFIERS]) {
    const rr = seq('green-' + mod.key);
    for (let n = 0; n < 200; n++) {
      const sp = roundSpec(n, rr, mod);
      assert.ok(sp.greenMs >= 84, `${mod.name} round ${n}: verde a ${sp.greenMs}ms`);
    }
  }
});

test('tre sovraccarichi chiudono la corsa', () => {
  const run = createRun({ seed: 'test-over', mode: 'endless' });
  let last = null, t = 0;
  for (let i = 0; i < CRACKS; i++) {
    const s = run.state.spec;
    run.press(t);
    last = run.tick(t + ((s.goldEnd + 0.2) / s.rate) * 1000);
    assert.equal(last.verdict, 'overload');
    t += 5000;
  }
  assert.equal(run.state.cracks, CRACKS);
  assert.equal(run.state.over, true);
  assert.equal(last.over, true);
  assert.equal(run.state.score, 0, 'il sovraccarico non assegna punti');
});

test('il sovraccarico è rilevato anche se il tick arriva tardi (frame persi)', () => {
  const run = createRun({ seed: 'test-late', mode: 'endless' });
  const s = run.state.spec;
  run.press(0);
  // Nessun tick per 3 secondi: il verdetto deve comunque essere sovraccarico.
  const ev = run.tick(3000);
  assert.equal(ev.verdict, 'overload');
});

test('il rilascio è esatto al millisecondo, indipendente dai frame disegnati', () => {
  const run = createRun({ seed: 'test-exact', mode: 'endless' });
  const s = run.state.spec;
  const target = s.goldStart + 0.001;
  const ev = releaseAt(run, target);
  assert.equal(ev.verdict, 'gold');

  const run2 = createRun({ seed: 'test-exact', mode: 'endless' });
  const ev2 = releaseAt(run2, s.goldStart - 0.001);
  assert.equal(ev2.verdict, 'safe', 'un millesimo prima dell oro è ancora banca sicura');
});

test('abort annulla la presa senza penalità', () => {
  const run = createRun({ seed: 'test-abort', mode: 'endless' });
  run.press(0);
  run.abort();
  assert.equal(run.state.holding, false);
  assert.equal(run.state.charge, 0);
  assert.equal(run.state.cracks, 0);
  assert.equal(run.state.score, 0);
  assert.equal(run.state.round, 0, 'il round non avanza');
});

test('la finestra d oro non scende sotto gli 85 ms su NESSUN modificatore', () => {
  for (const mod of [NEUTRAL, ...MODIFIERS]) {
    const r = seq('curve-' + mod.key);
    let min = Infinity;
    for (let n = 0; n < 300; n++) min = Math.min(min, roundSpec(n, r, mod).windowMs);
    assert.ok(min >= 85, `${mod.name}: finestra minima ${min}ms, sotto la soglia di lealtà`);
  }
});

test('ogni giorno riceve un modificatore, stabile e uguale per tutti', () => {
  const a = modifierFor('2026-09-12');
  assert.equal(a.key, modifierFor('2026-09-12').key, 'lo stesso giorno dà lo stesso modificatore');
  const keys = new Set();
  for (let d = 1; d <= 31; d++) keys.add(modifierFor(`2026-10-${String(d).padStart(2, '0')}`).key);
  assert.ok(keys.size >= 3, `in un mese devono comparire più modificatori, visti: ${keys.size}`);
});

test('i modificatori cambiano davvero la corsa, neutro compreso', () => {
  // Regressione: TEMPO aveva rateMul e widthMul entrambi 1.18, che nella finestra width/rate
  // si cancellavano: era identico al neutro pur dichiarandosi diverso.
  // Confronta la specifica intera, non solo la finestra: un modificatore può differire
  // per dove cade la banda (DRIFT) e non per quanto tempo dura.
  const curve = (m) => {
    const r = seq('same-seed');
    return Array.from({ length: 15 }, (_, n) => {
      const s = roundSpec(n, r, m);
      return `${s.windowMs}|${s.goldStart.toFixed(3)}|${s.rate.toFixed(3)}`;
    }).join(',');
  };
  const all = [NEUTRAL, ...MODIFIERS].map(curve);
  assert.equal(new Set(all).size, all.length, 'due curve coincidono');
  // E almeno la finestra deve differire dal neutro per tutti tranne DRIFT,
  // che per progetto si distingue sulla posizione.
  const winOnly = (m) => {
    const r = seq('same-seed');
    return Array.from({ length: 15 }, (_, n) => roundSpec(n, r, m).windowMs).join(',');
  };
  const nw = winOnly(NEUTRAL);
  for (const m of MODIFIERS) assert.notEqual(winOnly(m), nw, `${m.name}: finestra identica al neutro`);
  const neutral = curve(NEUTRAL);
  for (const m of MODIFIERS) {
    assert.notEqual(curve(m), neutral, `${m.name} è identico al neutro`);
  }
});

test('la chiave del giorno è in UTC, non in ora locale', () => {
  // 23:30 a Roma del 12 è ancora il 12 in UTC (21:30Z); 01:30 del 13 a Roma è il 12 in UTC (23:30Z).
  assert.equal(todayKey(new Date('2026-09-12T21:30:00Z')), '2026-09-12');
  assert.equal(todayKey(new Date('2026-09-12T23:30:00Z')), '2026-09-12');
  assert.equal(todayKey(new Date('2026-09-13T00:10:00Z')), '2026-09-13');
});

test('la difficoltà cresce in modo monotono e poi si stabilizza', () => {
  const r = seq('curve2');
  const w = [];
  for (let n = 0; n < 20; n++) w.push(roundSpec(n, r).windowMs);
  for (let i = 1; i < w.length; i++) assert.ok(w[i] <= w[i - 1], `round ${i} più facile del precedente`);
  assert.ok(w[0] > 300, 'il primo round deve essere comodo');
});

test('il tasto premuto due volte non riavvia la carica', () => {
  const run = createRun({ seed: 'test-double', mode: 'endless' });
  run.press(0);
  run.press(500); // ignorato
  const s = run.state.spec;
  const ev = run.release(1000);
  assert.ok(Math.abs(ev.charge - s.rate) < 1e-9, 'la carica conta dal primo press');
});

test('la chiave del giorno e il numero di corsa sono coerenti', () => {
  assert.equal(todayKey(new Date('2026-09-12T12:00:00Z')), '2026-09-12');
  assert.equal(dayNumber('2026-09-12'), 1);
  assert.equal(dayNumber('2026-09-13'), 2);
  assert.equal(dayNumber('2026-10-12'), 31);
});

test('una corsa completa produce un nastro coerente con i verdetti', () => {
  const run = createRun({ seed: 'tape', mode: 'daily' });
  let t = 0;
  const plan = ['gold', 'safe', 'overload', 'early'];
  for (const want of plan) {
    const s = run.state.spec;
    run.press(t);
    if (want === 'gold') run.release(t + (((s.goldStart + s.goldEnd) / 2) / s.rate) * 1000);
    else if (want === 'safe') run.release(t + (((s.safeStart + s.goldStart) / 2) / s.rate) * 1000);
    else if (want === 'early') run.release(t + (((s.safeStart) / 2) / s.rate) * 1000);
    else run.tick(t + ((s.goldEnd + 0.3) / s.rate) * 1000);
    t += 5000;
  }
  assert.deepEqual(run.state.tape, ['g', 's', 'x', 'f']);
  assert.equal(run.state.cracks, 2);
});
