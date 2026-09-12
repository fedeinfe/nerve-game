import { createRun, CRACKS } from './game.js';
import { createRenderer } from './render.js';
import { createLoop } from './loop.js';
import { todayKey, dayNumber } from './rng.js';
import { load, save } from './storage.js';
import * as sfx from './audio.js';
import { track } from './analytics.js';
import { showInterstitial } from './ads.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const renderer = createRenderer(canvas);

const el = {
  score: $('score'), chain: $('chain'), cracks: $('cracks'), prompt: $('prompt'),
  title: $('screen-title'), how: $('screen-how'), over: $('screen-over'),
  overScore: $('over-score'), overMode: $('over-mode'), overVerdict: $('over-verdict'),
  tape: $('over-tape'), statChain: $('stat-chain'), statGolds: $('stat-golds'), statBest: $('stat-best'),
  bestLine: $('best-line'), dailyLabel: $('daily-label'), sound: $('btn-sound'), share: $('btn-share'),
};

let run = null;
let mode = 'daily';
let justResolved = 0;

const DAY = todayKey();
const DAYN = dayNumber(DAY);

function bestKey(m) { return m === 'daily' ? `nerve.best.daily.${DAY}` : 'nerve.best.endless'; }
const getBest = (m) => load(bestKey(m), 0);
const getAllTime = () => load('nerve.best.alltime', 0);

// ---------- schermate ----------
function show(which) {
  for (const s of [el.title, el.how, el.over]) s.hidden = true;
  if (which) which.hidden = false;
  document.body.classList.toggle('playing', !which);
}

function refreshTitle() {
  el.dailyLabel.textContent = `Run #${DAYN}`;
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
  mode = m;
  sfx.unlock();
  const seed = m === 'daily' ? `daily-${DAY}` : `e-${Math.floor(Math.random() * 1e9)}`;
  run = createRun({ seed, mode: m });
  justResolved = 0;
  show(null);
  syncHud();
  setPrompt('HOLD ANYWHERE');
  track('game_start', { mode: m, day: DAYN });
  loop.start();
}

function syncHud() {
  if (!run) return;
  const s = run.state;
  el.score.textContent = s.score.toLocaleString('en-US');
  el.chain.textContent = `×${s.chain}`;
  el.chain.classList.toggle('hot', s.chain > 1);
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
  } else if (ev.verdict === 'flinch') {
    sfx.tone({ freq: 190, type: 'sine', gain: 0.22, decay: 0.12 });
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
  justResolved = 0.42;
  feedback(ev);
  syncHud();
  if (ev.verdict === 'gold') setPrompt(`GOLD  +${ev.gained.toLocaleString('en-US')}`);
  else if (ev.verdict === 'safe') setPrompt(`BANKED  +${ev.gained.toLocaleString('en-US')}`);
  else if (ev.verdict === 'flinch') setPrompt(`EARLY  +${ev.gained.toLocaleString('en-US')}`);
  else setPrompt(run.state.cracks >= CRACKS ? 'OVERLOAD' : `OVERLOAD  ${CRACKS - run.state.cracks} LEFT`);
  if (ev.over) endRun();
}

async function endRun() {
  const s = run.state;
  loop.stop();
  track('game_over', { mode, score: s.score, rounds: s.round, golds: s.golds, best_chain: s.bestChain, day: DAYN });

  if (s.score > getBest(mode)) save(bestKey(mode), s.score);
  if (s.score > getAllTime()) save('nerve.best.alltime', s.score);

  el.overScore.textContent = s.score.toLocaleString('en-US');
  el.overMode.textContent = mode === 'daily' ? `DAILY RUN #${DAYN}` : 'ENDLESS';
  el.overVerdict.textContent = verdictLine(s);
  el.statChain.textContent = `×${s.bestChain}`;
  el.statGolds.textContent = String(s.golds);
  el.statBest.textContent = getAllTime().toLocaleString('en-US');
  el.tape.innerHTML = s.tape.map((t) => `<i class="${t}"></i>`).join('');

  // L'annuncio, quando esisterà, sta in una pausa naturale e non blocca il ritorno al gioco.
  await showInterstitial('game_over');
  setTimeout(() => { show(el.over); setPrompt(''); }, 460);
}

function verdictLine(s) {
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
function press(e) {
  if (!run || run.state.over || !document.body.classList.contains('playing')) return;
  if (justResolved > 0) return;
  e.preventDefault();
  sfx.unlock();
  setPrompt('');
  run.press(performance.now());
  sfx.tone({ freq: 220, type: 'sine', gain: 0.16, attack: 0.004, decay: 0.07 });
}

function release(e) {
  if (!run || run.state.over || !run.state.holding) return;
  e.preventDefault();
  const ev = run.release(performance.now());
  if (ev) onResolved(ev);
}

canvas.addEventListener('pointerdown', press, { passive: false });
window.addEventListener('pointerup', release, { passive: false });
window.addEventListener('pointercancel', release, { passive: false });

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
    run.abort();
    setPrompt('HOLD ANYWHERE');
  }
});

// ---------- condivisione ----------
const EMOJI = { g: '🟡', s: '🟢', x: '🔴' };
function shareText(s) {
  const tape = s.tape.slice(0, 24).map((t) => EMOJI[t]).join('');
  const head = mode === 'daily' ? `NERVE — daily run #${DAYN}` : 'NERVE — endless';
  return `${head}\n${s.score.toLocaleString('en-US')} · best chain ×${s.bestChain}\n${tape}\n${location.origin}${location.pathname}`;
}

el.share.addEventListener('click', async () => {
  if (!run) return;
  const text = shareText(run.state);
  track('share_click', { mode, score: run.state.score });
  try {
    if (navigator.share) { await navigator.share({ text }); track('share_done', { via: 'native' }); return; }
  } catch { /* l'utente ha annullato: non è un errore */ }
  try {
    await navigator.clipboard.writeText(text);
    el.share.textContent = 'Copied!';
    setTimeout(() => { el.share.textContent = 'Share result'; }, 1600);
    track('share_done', { via: 'clipboard' });
  } catch {
    el.share.textContent = 'Copy failed';
    setTimeout(() => { el.share.textContent = 'Share result'; }, 1600);
  }
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
track('app_open', { day: DAYN });
