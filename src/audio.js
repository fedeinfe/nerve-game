// Sintesi WebAudio: nessun file da scaricare, nessuna licenza da verificare.
import { load, save } from './storage.js';

let ctx = null;
let master = null;
let enabled = load('cx.sound', true);

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

// iOS sblocca l'audio solo dentro un gesto dell'utente.
export function unlock() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export const isEnabled = () => enabled;
export function setEnabled(v) {
  enabled = v;
  save('cx.sound', v);
  if (v) unlock();
}

function env(node, gain, attack, decay) {
  const t = ctx.currentTime;
  node.gain.setValueAtTime(0.0001, t);
  node.gain.exponentialRampToValueAtTime(gain, t + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

export function tone({ freq = 440, type = 'sine', gain = 0.5, attack = 0.005, decay = 0.18, slide = 0 }) {
  if (!enabled) return;
  const c = ensure();
  if (!c || c.state === 'suspended') return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + attack + decay);
    env(g, gain, attack, decay);
    osc.connect(g).connect(master);
    osc.start();
    osc.stop(c.currentTime + attack + decay + 0.02);
  } catch {}
}

export function noise({ gain = 0.3, decay = 0.2, hp = 800 }) {
  if (!enabled) return;
  const c = ensure();
  if (!c || c.state === 'suspended') return;
  try {
    const len = Math.floor(c.sampleRate * decay);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = hp;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(filt).connect(g).connect(master);
    src.start();
  } catch {}
}
