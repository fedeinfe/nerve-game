// Astrazione pubblicitaria: nessuna rete è attiva finché non c'è un'approvazione reale.
// Il gioco deve restare integro con gli annunci spenti, falliti o bloccati.

const CONFIG = {
  enabled: false,        // acceso solo quando una rete è approvata e operativa
  network: null,
  testMode: true,
};

export function adsEnabled() {
  return CONFIG.enabled && !!CONFIG.network;
}

export function configureAds(patch) {
  Object.assign(CONFIG, patch);
}

// Restituisce sempre una promessa risolta: un errore della rete non deve
// bloccare il ritorno al gioco.
export function showInterstitial(reason) {
  if (!adsEnabled()) return Promise.resolve({ shown: false, reason: 'disabled' });
  return Promise.resolve({ shown: false, reason: 'not_configured' });
}

export function showRewarded() {
  if (!adsEnabled()) return Promise.resolve({ shown: false, rewarded: false, reason: 'disabled' });
  return Promise.resolve({ shown: false, rewarded: false, reason: 'not_configured' });
}
