// Ogni accesso a localStorage può lanciare (Safari privato, storage disabilitato,
// contesto di anteprima). Il gioco deve restare giocabile senza persistenza.
const MEM = new Map();
let healthy = true;

function probe() {
  try {
    const k = '__t__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
healthy = probe();

export const storageAvailable = () => healthy;

export function load(key, fallback) {
  try {
    const raw = healthy ? localStorage.getItem(key) : MEM.get(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (healthy) localStorage.setItem(key, raw);
    else MEM.set(key, raw);
  } catch {
    healthy = false;
    MEM.set(key, raw);
  }
}
