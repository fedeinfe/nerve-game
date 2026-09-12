// PRNG deterministico: stesso seme -> stessa sequenza, su ogni dispositivo.
// Necessario perché la sfida quotidiana sia identica per tutti i giocatori.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Giorno di gioco in UTC, non in ora locale: perché due persone in fusi diversi
// che confrontano il punteggio di "oggi" debbano aver giocato la stessa corsa.
export function todayKey(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayNumber(key) {
  const epoch = Date.UTC(2026, 8, 12);
  const [y, m, d] = key.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - epoch) / 86400000) + 1;
}
