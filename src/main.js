import { createRun, CRACKS, modifierFor, NEUTRAL, bankValue } from './game.js';
import { createRenderer } from './render.js';
import { createLoop } from './loop.js';
import { todayKey, dayNumber } from './rng.js';
import { load, save } from './storage.js';
import * as sfx from './audio.js';
import { showInterstitial } from './ads.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const renderer = createRenderer(canvas);

const el = {
  hud: $('hud'), score: $('score'), chain: $('chain'), cracks: $('cracks'), prompt: $('prompt'),
  title: $('screen-title'), how: $('screen-how'), over: $('screen-over'),
  overScore: $('over-score'), overMode: $('over-mode'), overVerdict: $('over-verdict'),
  tape: $('over-tape'), statChain: $('stat-chain'), statBank: $('stat-bank'), statBest: $('stat-best'),
  bestLine: $('best-line'), dailyLabel: $('daily-label'), dailyBlurb: $('daily-blurb'),
  sound: $('btn-sound'), share: $('btn-share'),
};

let run = null;
let mode = 'daily';
let justResolved = 0;
// La prima partita in assoluto guida con tre frasi ancorate a cosa sta succedendo.
// La causa numero uno di abbandono nei giochi web piccoli è non capire le regole in dieci secondi.
let coach = load('nerve.coached', false) ? 0 : 1;
const POINTER_HINT = matchMedia('(hover: hover) and (pointer: fine)').matches
  ? 'HOLD MOUSE OR SPACE' : 'HOLD ANYWHERE';

// Ricalcolato a ogni partenza: una scheda lasciata aperta a cavallo della mezzanotte UTC
// giocherebbe altrimenti il daily di ieri, con il modificatore di ieri.
let DAY = todayKey();
let DAYN = dayNumber(DAY);
let TODAY_MOD = modifierFor(DAY);

function refreshDay() {
  const k = todayKey();
  if (k === DAY) return false;
  DAY = k;
  DAYN = dayNumber(k);
  TODAY_MOD = modifierFor(k);
  return true;
}

const getBest = (m) => {
  if (m !== 'daily') return load('nerve.best.endless', 0);
  const rec = load('nerve.best.daily', null);
  return rec && rec.d === DAY ? rec.s : 0;
};
const saveBest = (m, score) => {
  if (m === 'daily') save('nerve.best.daily', { d: DAY, s: score });
  else save('nerve.best.endless', score);
};
const getAllTime = () => load('nerve.best.alltime', 0);

// ---------- schermate ----------
function show(which) {
  for (const s of [el.title, el.how, el.over]) s.hidden = true;
  if (which) which.hidden = false;
  document.body.classList.toggle('playing', !which);
}

function refreshTitle() {
  el.dailyLabel.textContent = `#${DAYN} · ${TODAY_MOD.name}`;
  if (el.dailyBlurb) el.dailyBlurb.textContent = TODAY_MOD.blurb;
  const bd = getBest('daily');
  const at = getAllTime();
  el.bestLine.textContent = bd ? `TODAY ${bd.toLocaleString('en-US')} · BEST ${at.toLocaleString('en-US')}`
    : at ? `BEST ${at.toLocaleString('en-US')}` : '';
}

function setPrompt(text) {
  el.prompt.textContent = text || '';
  el.prompt.classList.toggle('show', !!text);
}

// ---------- partita ----------
function start(m) {
  refreshDay();
  mode = m;
  sfx.unlock();
  const seed = m === 'daily' ? `daily-${DAY}` : `e-${Math.floor(Math.random() * 1e9)}`;
  run = createRun({ seed, mode: m, modifier: m === 'daily' ? TODAY_MOD : NEUTRAL });
  justResolved = 0;
  show(null);
  syncHud();
  setPrompt(coach ? 'HOLD TO CHARGE' : POINTER_HINT);
  loop.start();
}

function syncHud() {
  if (!run) return;
  const s = run.state;
  el.score.textContent = s.score.toLocaleString('en-US');
  el.chain.textContent = `×${s.chain}`;
  el.chain.classList.toggle('hot', s.chain > 1);
  el.hud.setAttribute('aria-label',
    `Score ${s.score}. Chain times ${s.chain}. ${CRACKS - s.cracks} of ${CRACKS} cracks left.`);
  const dots = el.cracks.children;
  for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('spent', i < s.cracks);
}

function feedback(ev) {
  const cx = innerWidth / 2, cy = innerHeight * 0.46;
  const R = Math.min(innerWidth, innerHeight) * 0.30;
  renderer.impact(ev.verdict, cx, cy, R);

  if (ev.verdict === 'gold') {
    sfx.tone({ freq: 520 + Math.min(ev.chain, 10) * 55, type: 'triangle', gain: 0.5, decay: 0.22 });
    sfx.tone({ freq: 1040 + Math.min(ev.chain, 10) * 110, type: 'sine', gain: 0.22, attack: 0.01, decay: 0.3 });
    buzz(18);
  } else if (ev.verdict === 'safe') {
    sfx.tone({ freq: 330, type: 'sine', gain: 0.32, decay: 0.16 });
    buzz(8);
  } else if (ev.verdict === 'early') {
    sfx.tone({ freq: 210, type: 'square', gain: 0.26, decay: 0.18, slide: -70 });
    buzz([25, 30]);
  } else {
    sfx.noise({ gain: 0.4, decay: 0.35, hp: 320 });
    sfx.tone({ freq: 150, type: 'sawtooth', gain: 0.4, decay: 0.4, slide: -110 });
    buzz([35, 40, 60]);
  }
}

function buzz(pattern) {
  if (!sfx.isEnabled()) return;
  try { navigator.vibrate && navigator.vibrate(pattern); } catch {}
}

function onResolved(ev) {
  justResolved = 0.28;
  feedback(ev);
  syncHud();
  if (ev.verdict === 'gold') setPrompt(`GOLD  ×${ev.chain}  POT ${bankValue(0.5, ev.chain).toLocaleString('en-US')}`);
  else if (ev.verdict === 'safe') setPrompt(`BANKED  +${ev.gained.toLocaleString('en-US')}`);
  else if (ev.verdict === 'early') setPrompt(run.state.cracks >= CRACKS ? 'TOO EARLY' : `TOO EARLY  ${CRACKS - run.state.cracks} LEFT`);
  else if (ev.byAHair && run.state.cracks < CRACKS) setPrompt(`BY A HAIR  ${CRACKS - run.state.cracks} LEFT`);
  else setPrompt(run.state.cracks >= CRACKS ? 'OVERLOAD' : `OVERLOAD  ${CRACKS - run.state.cracks} LEFT`);

  if (coach === 1 && (ev.verdict === 'gold' || ev.verdict === 'safe')) {
    coach = 2;
    setTimeout(() => {
      if (run && !run.state.over) {
        setPrompt(ev.verdict === 'gold' ? 'GOLD BUILDS THE POT — GREEN BANKS IT. MISS BOTH AND YOU CRACK.' : 'GREEN BANKED IT. GOLD WOULD HAVE GROWN IT.');
      }
    }, 900);
  } else if (coach === 2) {
    coach = 0;
    save('nerve.coached', true);
  }
  if (ev.over) endRun();
}

async function endRun() {
  const s = run.state;

  if (s.score > getBest(mode)) saveBest(mode, s.score);
  if (s.score > getAllTime()) save('nerve.best.alltime', s.score);

  el.overScore.textContent = s.score.toLocaleString('en-US');
  el.overMode.textContent = mode === 'daily' ? `DAILY #${DAYN} · ${TODAY_MOD.name}` : 'ENDLESS';
  el.overVerdict.textContent = verdictLine(s);
  el.statChain.textContent = `×${s.bestChain}`;
  el.statBank.textContent = s.bestBank.toLocaleString('en-US');
  el.statBest.textContent = getAllTime().toLocaleString('en-US');
  el.tape.innerHTML = s.tape.map((t) => `<i class="${t}"></i>`).join('');
  // Senza questo il nastro è una fila di div vuoti con un'etichetta che non dice nulla.
  const NAMES = { g: 'gold', s: 'banked', f: 'too early', x: 'overload' };
  const counted = s.tape.reduce((acc, t) => ((acc[t] = (acc[t] || 0) + 1), acc), {});
  el.tape.setAttribute('aria-label',
    'Your run, ' + s.tape.length + ' rounds: ' +
    Object.entries(counted).map(([k, v]) => `${v} ${NAMES[k]}`).join(', '));

  // L'annuncio, quando esisterà, sta in una pausa naturale e non blocca il ritorno al gioco.
  await showInterstitial('game_over');
  setTimeout(() => { loop.stop(); show(el.over); setPrompt(''); }, 460);
}

function verdictLine(s) {
  if (s.banked === 0) return 'NEVER BANKED A THING';
  if (s.bestChain >= 8) return 'ICE IN THE VEINS';
  if (s.bestChain >= 5) return 'STEADY HAND';
  if (s.bestChain >= 3) return 'NERVE HOLDING';
  if (s.golds === 0) return 'ALL SAFE, NO GLORY';
  return 'SHAKY';
}

// ---------- ciclo ----------
const loop = createLoop({
  update(dt) {
    if (justResolved > 0) justResolved -= dt;
    if (!run) return;
    const ev = run.tick(performance.now());
    if (ev) onResolved(ev);
  },
  render() {
    renderer.draw(run, 0, false);
  },
});

// ---------- input ----------
// Solo il puntatore che ha iniziato la presa può chiuderla: senza questo, un secondo
// dito appoggiato sullo schermo risolve il round del primo.
let holdPointer = null;

function press(e) {
  if (!run || run.state.over || !document.body.classList.contains('playing')) return;
  if (justResolved > 0) return;
  // Solo il tasto primario del mouse: il destro apre il menu contestuale e chiuderebbe il round.
  if (e.button !== undefined && e.button !== 0) return;
  if (holdPointer !== null) return;
  holdPointer = e.pointerId === undefined ? 'key' : e.pointerId;
  e.preventDefault();
  sfx.unlock();
  setPrompt('');
  run.press(performance.now());
  sfx.tone({ freq: 220, type: 'sine', gain: 0.16, attack: 0.004, decay: 0.07 });
  if (coach === 1) setPrompt('RELEASE INSIDE THE RING — NOT BEFORE, NOT AFTER');
}

function release(e) {
  if (!run || run.state.over || !run.state.holding) return;
  const id = e.pointerId === undefined ? 'key' : e.pointerId;
  if (holdPointer !== null && id !== holdPointer) return;
  holdPointer = null;
  e.preventDefault();
  const ev = run.release(performance.now());
  if (ev) onResolved(ev);
}

// pointercancel non è un rilascio: il sistema ha tolto il puntatore (gesto di sistema,
// chiamata in arrivo). Risolvere il round qui punirebbe il giocatore per un evento non suo.
function cancelHold(e) {
  const id = e.pointerId === undefined ? 'key' : e.pointerId;
  if (holdPointer !== null && id !== holdPointer) return;
  holdPointer = null;
  if (run && run.state.holding) {
    run.abort();
    setPrompt(coach ? 'HOLD TO CHARGE' : POINTER_HINT);
  }
}

canvas.addEventListener('pointerdown', press, { passive: false });
window.addEventListener('pointerup', release, { passive: false });
window.addEventListener('pointercancel', cancelHold, { passive: false });
window.addEventListener('blur', () => { if (run && run.state.holding) cancelHold({}); });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) press(e);
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') release(e);
});

// Tornare da una scheda in background non deve costare una crepa:
// la presa in corso viene annullata e il round riparte pulito.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && run && run.state.holding) {
    holdPointer = null;
    run.abort();
    setPrompt(coach ? 'HOLD TO CHARGE' : POINTER_HINT);
  }
});

// ---------- condivisione ----------
const EMOJI = { g: '🟡', s: '🟩', f: '🔸', x: '🟥' };
function shareText(s) {
  const tape = s.tape.slice(0, 24).map((t) => EMOJI[t]).join('');
  const head = mode === 'daily' ? `NERVE — daily #${DAYN} · ${TODAY_MOD.name}` : 'NERVE — endless';
  return `${head}\n${s.score.toLocaleString('en-US')} · best chain ×${s.bestChain}\n${tape}\n${location.origin}${location.pathname}`;
}

el.share.addEventListener('click', async () => {
  if (!run) return;
  const text = shareText(run.state);
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch { /* l'utente ha annullato: non è un errore */ }
  try {
    await navigator.clipboard.writeText(text);
    el.share.textContent = 'Copied!';
    setTimeout(() => { el.share.textContent = 'Share result'; }, 1600);
    return;
  } catch { /* clipboard non disponibile: si scende all'ultimo livello */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    el.share.textContent = ok ? 'Copied!' : 'Copy failed';
  } catch {
    el.share.textContent = 'Copy failed';
  }
  setTimeout(() => { el.share.textContent = 'Share result'; }, 1600);
});

// ---------- comandi ----------
$('btn-daily').addEventListener('click', () => start('daily'));
$('btn-endless').addEventListener('click', () => start('endless'));
$('btn-again').addEventListener('click', () => start(mode));
$('btn-home').addEventListener('click', () => { run = null; refreshTitle(); show(el.title); renderer.draw(null); });
$('btn-how').addEventListener('click', () => show(el.how));
$('btn-how-back').addEventListener('click', () => show(el.title));

el.sound.addEventListener('click', () => {
  const next = !sfx.isEnabled();
  sfx.setEnabled(next);
  el.sound.textContent = `Sound: ${next ? 'on' : 'off'}`;
  el.sound.setAttribute('aria-pressed', String(next));
});

// ---------- avvio ----------
el.sound.textContent = `Sound: ${sfx.isEnabled() ? 'on' : 'off'}`;
el.sound.setAttribute('aria-pressed', String(sfx.isEnabled()));
refreshTitle();
show(el.title);
renderer.draw(null);
window.addEventListener('resize', () => renderer.draw(run));
