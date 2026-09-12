// Misurazione minima e senza cookie: conteggi aggregati, nessun identificatore persistente
// inviato a terzi. Il traffico di sviluppo è marcato e va escluso dalle metriche commerciali.
const DEV_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];
export const isDev = DEV_HOSTS.includes(location.hostname) || location.protocol === 'file:';

let sink = null;
const queue = [];

export function configure(fn) {
  sink = fn;
  while (queue.length) sink(queue.shift());
}

export function track(name, props = {}) {
  const ev = { name, props, t: Math.round(performance.now()), dev: isDev };
  if (isDev) {
    console.debug('[track]', name, props);
    return;
  }
  if (sink) sink(ev);
  else queue.push(ev);
}
