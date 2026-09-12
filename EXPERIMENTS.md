# EXPERIMENTS — test, soglie, risultati e limiti

## E1 · Curva di difficoltà — 2.500 corse simulate per profilo
**Domanda:** una partita dura davvero 30–120 secondi, per tutti i livelli di abilità?
**Metodo:** `test/balance.mjs`. Giocatore simulato che mira al centro dell'oro con errore gaussiano
sul tempo di rilascio (σ = precisione motoria) e una probabilità `greed` di rischiare l'oro invece di
bancare. Il motore è quello vero (`src/game.js`), non una copia.

**Prima versione — bocciata:**

| Profilo | Mediana | p10–p90 |
|---|---|---|
| Principiante (σ=90 ms) | **25 s** | 17–39 s |
| Medio (σ=55 ms) | 31 s | 21–48 s |
| Esperto (σ=30 ms) | 58 s | 34–98 s |

Il principiante moriva in 17–25 secondi: la prima partita è quella che decide se uno torna.
Sweep di 4 varianti con `test/tune.mjs`, scelta la variante B.

**Versione spedita:**

| Modificatore | Principiante | Medio |
|---|---|---|
| ENDLESS (neutro) | 31 s (22–46) | 39 s (28–56) |
| STEADY | 39 s (29–54) | 48 s (37–66) |
| TEMPO | 29 s (20–42) | 35 s (26–52) |
| HAIRLINE | 37 s (26–53) | 45 s (33–64) |
| DRIFT | 34 s (24–49) | 41 s (30–59) |
| SURGE | 30 s (21–46) | 37 s (26–55) |

**Limite dichiarato:** è un modello di giocatore, non un giocatore. Assume errore gaussiano e
`greed` costante; una persona vera impara, si innervosisce e cambia strategia dopo una crepa.
Serve a escludere curve palesemente sbagliate, **non** a prevedere il divertimento.

## E2 · Soglia di lealtà della finestra d'oro
**Soglia fissata a priori:** 85 ms. Sotto, la finestra non è più anticipabile e il gioco diventa
una lotteria.
**Risultato:** la prima implementazione (pavimento sulla larghezza dell'arco) lasciava TEMPO
scendere a **73 ms**. Corretto legando il pavimento al tempo. Tutti e sei i profili ora si fermano
esattamente a 85 ms, ed è verificato da un test su 300 round per curva.

## E3 · Regole del gioco — 16 test automatici
`node --test test/game.test.mjs` — **16/16 verdi**. Coprono: determinismo del seme, i quattro
verdetti ai bordi esatti, i moltiplicatori, catena che cresce e si azzera, tre crepe che chiudono la
corsa, sovraccarico rilevato con tick in forte ritardo, rilascio esatto al millisecondo, `abort`
senza penalità, pavimento a 85 ms su ogni modificatore, modificatore stabile per giorno,
curve realmente diverse fra modificatori, chiave del giorno in UTC, nastro coerente coi verdetti.

## E4 · Deploy pubblico
13 file verificati su `https://fedeinfe.github.io/nerve-game/`: tutti **HTTP 200**, MIME corretti,
~43 KB totali esclusa la webfont. Nessuna corrispondenza per chiavi/segreti nel bundle.

## E5 · Ambiente di test — quello che NON è stato verificato
- **Nessun dispositivo fisico.** Non posseggo telefoni: nessun test su hardware reale.
- Il browser automatizzato disponibile **strozza `requestAnimationFrame` a ~1 fps** pur dichiarando
  la pagina visibile (misurato: 1 frame in 872 ms). **Il game feel non è stato validato.** Ha però
  prodotto un miglioramento reale: ha spinto ad ancorare la carica all'orologio invece che ai frame.
- Non testati su browser reale: fluidità, latenza del tocco, resa dell'audio, vibrazione, comportamento
  con rete lenta.
- **Nessun dato di utenti reali.** La misurazione non è attiva (vedi `DECISIONS.md D11`):
  gli utenti reali non sono osservabili oggi.
