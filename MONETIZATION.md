# MONETIZATION — stato reale e percorso di attivazione

## Stato al 2026-09-12 18:00 CEST

**Nessuna rete pubblicitaria è attiva. Ricavi osservati: 0,00 EUR.**

Non è una stima e non è un'assenza di accesso: non esiste alcun account publisher collegato a
questo progetto, nessuno script pubblicitario è caricato dalla pagina, e `src/ads.js` è spento
alla costante `CONFIG.enabled = false`. Puoi verificarlo tu stesso:

```bash
curl -s https://fedeinfe.github.io/nerve-game/ | grep -ci "adsbygoogle\|googletag\|adsterra\|propeller" 
# atteso: 0
```

## Perché non è stato attivato

Vedi `DECISIONS.md D7`. In sintesi: il valore atteso oggi è **negativo**, non nullo.
Zero traffico significa zero ricavo con qualunque rete; in cambio, un tag popunder — l'unico
formato realisticamente disponibile a un publisher nuovo sulle reti a approvazione rapida —
farebbe rimuovere il post su r/WebGames e brucerebbe lo slot mensile non rinnovabile di
r/playmygame. In più renderebbe false le dichiarazioni già pubblicate in `privacy.html`.

## Cosa serve, per ogni percorso

| Percorso | Blocco reale | Tempo realistico |
|---|---|---|
| **AdSense** | Verifica PIN via **posta cartacea** (~3 settimane, senza tracking). Soglia 70 EUR. | Settimane. Fuori portata per costruzione. |
| **H5 Games Ads** (interstitial + rewarded per giochi HTML5) | Richiede AdSense **già approvato**, poi una **seconda** domanda di allowlisting, esito non garantito. | Settimane, in sequenza. |
| **Reti dirette** (Adsterra e simili) | Richiedono che sia **il titolare** ad aprire l'account e inserire dati di identità e pagamento. Nessuna fonte ufficiale conferma che accettino un sottodominio `github.io`. Formati ostili a un gioco da 60 secondi. | Ore, ma solo se apri tu l'account. |
| **Portali** (CrazyGames, GameDistribution, GameMonetize) | Onboarding fiscale completo, NET60, soglie ~100 EUR. CrazyGames **vieta gli ads esterni**. | Giorni/settimane. |
| **itch.io** | Non fa pubblicità del tutto. Serve come vetrina. | — |

## Se e quando attivare: l'ordine corretto

1. **Prima il traffico.** Nessun tag prima che esistano sessioni reali misurate. Soglia
   ragionevole: ~200 sessioni organiche. Sotto quel numero, la pubblicità è solo un costo di
   reputazione.
2. **Poi l'hosting giusto.** Migrare a **Cloudflare Pages** con un dominio proprio (~11 USD/anno).
   I termini di GitHub Pages nominano solo donazioni e crowdfunding come monetizzazione permessa:
   con annunci attivi si entra in una zona grigia reale, e un dominio proprio la elimina —
   insieme al rischio che una rete rifiuti un sottodominio gratuito.
3. **Poi la rete**, scelta in base al formato, non alla velocità di approvazione. Per un gioco a
   sessione breve l'unico formato sano è il **rewarded facoltativo** (es. "continua dopo la terza
   crepa"), mai un popunder e mai un interstitial durante una presa.
4. **Solo allora il tag**, dietro il flag già predisposto.

## Dove si innesta, esattamente

`src/ads.js` espone tre funzioni e nessun'altra parte del codice conosce la rete:

```js
configureAds({ enabled: true, network: 'nome', testMode: true });  // accensione
showInterstitial(reason)  // -> Promise<{shown}>   già chiamata alla fine della corsa
showRewarded()            // -> Promise<{shown, rewarded}>   non ancora collegata a una ricompensa
```

Entrambe risolvono **sempre**, anche in errore: un guasto della rete non può bloccare il ritorno al
gioco. `showInterstitial('game_over')` è già chiamata in `src/main.js` nella pausa naturale dopo la
fine della corsa — mai durante una presa.

**Prima di accendere, va aggiornata `privacy.html`**, che oggi dichiara correttamente
"no advertising is served on this site". Attivare un tag senza aggiornarla renderebbe falsa
un'informativa pubblicata — e, in UE, va richiesto il consenso **prima** di qualunque tracciamento.

## Regole che restano valide sempre

Mai clic sui propri annunci, mai traffico artificiale, mai incentivi al clic, mai contare il
traffico di sviluppo nelle metriche commerciali (`src/analytics.js` marca già il traffico locale
con `dev: true` e non lo inoltra).
