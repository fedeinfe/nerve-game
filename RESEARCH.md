# RESEARCH — fonti, candidati, scelta

Ricerca condotta 2026-09-12 10:04–10:25 CEST da 12 agenti in parallelo (4 ricognizione,
6 candidati, 2 revisione avversariale). 0 errori. Tutte le URL sono state consultate quel giorno.

Le affermazioni sono etichettate: **[osservato]** = letto sulla fonte primaria ·
**[promozionale]** = dichiarazione di chi vende · **[ipotesi]** = giudizio non sostenuto da fonte.

---

## 1. Monetizzazione pubblicitaria

| Fonte | Cosa dice | Etichetta |
|---|---|---|
| [AdSense — requisiti di idoneità](https://support.google.com/adsense/answer/9724) | Nessun requisito di traffico o anzianità del dominio. Richiede 18 anni, contenuti originali, accesso al codice HTML. Nessun tempo di revisione dichiarato. | [osservato] |
| [AdSense — verifica PIN](https://support.google.com/adsense/answer/157667) | PIN a 6 cifre inviato per **posta cartacea internazionale**, ~3 settimane, senza tracking; 4 mesi di tempo massimo poi gli annunci si spengono. | [osservato] |
| [AdSense — soglie di pagamento](https://support.google.com/adsense/answer/1709871) | Soglia **70 EUR** / 100 USD. | [osservato] |
| [H5 Games Ads](https://support.google.com/adsense/answer/1705831) | Richiede un account AdSense **già approvato**, poi una **seconda** domanda di allowlisting. "Account approval is not guaranteed." | [osservato] |
| [Ad Placement API](https://developers.google.com/ad-placement) | È l'API tecnicamente corretta per i giochi HTML5 (interstitial + rewarded), ma è a valle del doppio gate. | [osservato] |
| adsterra.com/blog | Zero traffico minimo, approvazione sito in 5–10 minuti, soglia 5 USD via Paxum / 25 USD via PayPal. | **[promozionale]** — è il venditore che descrive il proprio imbuto. Non è un SLA. |
| eCPM web: 3,62 USD rewarded globale / 6,98 USD USA / 0,50–2 USD display | **Ritirato.** La revisione avversariale ha rilevato che questi numeri erano gli unici della sezione **senza URL**. | **[non sostenuto — non usato]** |

**Conclusione.** Nessun percorso di monetizzazione è attivabile oggi:
- AdSense e H5 Games Ads sono fuori portata **per costruzione** (posta cartacea, doppia approvazione).
- Le reti dirette richiedono che sia **il titolare** ad aprire l'account e a inserire dati di identità
  e pagamento: sono azioni che non eseguo.
- CrazyGames / GameDistribution / GameMonetize: onboarding fiscale, NET60, soglie 100 EUR.
- itch.io non fa pubblicità.

**Aritmetica che non dipende dall'eCPM** (sostituisce i numeri ritirati): per raggiungere la
soglia PayPal di 25 USD servono decine di migliaia di impression, contro le decine di sessioni
realistiche di un lancio organico. Il rapporto è di due ordini di grandezza in ogni scenario.

## 2. Hosting

| Piattaforma | Verdetto | Etichetta |
|---|---|---|
| **Vercel Hobby** | I termini elencano **testualmente** l'inclusione di annunci, AdSense compreso, come uso commerciale vietato sul piano gratuito. **Escluso.** | [osservato] |
| **Cloudflare Pages free** | L'unico dei quattro i cui termini non contengono clausole contro pubblicità o uso commerciale. Richieste statiche gratuite e illimitate. | [osservato] |
| **GitHub Pages** | Vieta l'uso come hosting gratuito per "run your online business" e nomina solo donazioni e crowdfunding come monetizzazione permessa. Zona grigia **se** ci sono annunci. | [osservato] |
| **Netlify free** | Non vieta le ads, ma il cap di 300 crediti/mese (~15 GB) mette il sito in pausa proprio quando arriva traffico. | [osservato] |
| Domini gratuiti (is-a.dev, js.org, eu.org) | is-a.dev vieta per iscritto la monetizzazione; js.org accetta solo progetti dell'ecosistema JS; eu.org scoraggia i siti commerciali, approvazione manuale non garantita. **Tutti inutilizzabili.** | [osservato] |

**Scelta: GitHub Pages.** Cloudflare Pages ha termini migliori, ma richiede un signup che non posso
effettuare. GitHub Pages è l'unico su cui posso deployare davvero, con `gh` già autenticato.
La zona grigia dei termini è funzione **degli annunci**, non dell'hosting: senza annunci non morde.
Se un giorno si monetizza, si migra a Cloudflare Pages con un dominio proprio.

## 3. Distribuzione

| Canale | Può funzionare oggi | Vincolo verificato |
|---|---|---|
| **r/WebGames** | Sì | **Regola P7: il gioco deve funzionare anche su desktop col mouse.** Niente repost per 3 mesi. |
| **r/playmygame** | Sì | Flair obbligatorio, **1 post al mese**, va dichiarato il proprio ruolo. |
| r/IndieGaming | No | Richiede account di almeno 1 settimana con storico. |
| r/gamedev | No | Mostrare il proprio progetto è **vietato**; un post-solo-link porta al ban. |
| **Show HN** | Non oggi | Sabato mattina CEST = 4–7 del mattino a New York. Slot di fatto unico per progetto. Meglio martedì–giovedì ~14:00–15:00 CEST. |
| itch.io | Vetrina, non canale | Un progetto di account nuovo resta fuori da search e browse fino a ~2 settimane. Mediana lifetime ~1.582 views. |
| TikTok Ads | **No** | Minimo ufficiale **50 USD/giorno** per campagna: 10 EUR non esistono come opzione. |
| Reddit / Meta Ads | **No** | Richiedono metodo di pagamento valido e review dell'account. |

**Regole anti-AI — il rischio di rimozione più concreto.** r/indiegames vieta del tutto i post con
GenAI; r/incremental_games impone una sezione di AI disclosure; r/DestroyMyGame nomina Claude
esplicitamente; r/playmygame rende rimovibili le dichiarazioni false. **Mentire non è un'opzione** —
il materiale di lancio preparato dichiara apertamente come è stato costruito.

## 4. Prodotto e concorrenza

- **Rischio legale evitato:** il NYT rivendica le meccaniche di Wordle (griglia 5×6, tessere verdi e
  gialle) e ha notificato DMCA a centinaia di repository **su GitHub**, che è esattamente dove si
  pubblica. Niente cloni, niente nomi in `-dle`. NERVE non tocca nessuno di questi elementi. [osservato]
  *Nota onesta: non risulta che la rivendicazione sia mai stata testata in tribunale — i destinatari
  hanno ceduto — ma il takedown arriva comunque.*
- **Cause di abbandono osservate nei giochi web piccoli:** regole incomprensibili nei primi dieci
  secondi, assenza di una schermata di fine partita esplicita, muro di registrazione, target di tocco
  troppo piccoli. Tutte e quattro sono state indirizzate esplicitamente nel prodotto.
- **Limite del campione:** le percentuali sulle recensioni negative poggiano su 4 app e 200 recensioni
  del solo store USA. È indicativo, **non** una statistica di settore, e non viene usato come tale.
- **Reddit non è stato leggibile** dall'ambiente automatizzato (403 anti-bot). Le regole dei subreddit
  sono state lette passando dal browser; i dati di volume dei post sono osservati, le soglie
  AutoModerator (karma, età minima) **non sono esposte da nessuna API** e restano non verificabili.

## 5. I sei candidati valutati

Pesi: fattibilità 25 · distribuzione 20 · monetizzazione 20 · rigiocabilità 20 · differenziazione 15.

| Idea | Punteggio | Esito |
|---|---|---|
| BANCA (push-your-luck) | 72 | Scartata — vedi sotto |
| OFF BY (timing di precisione) | 64 | **Famiglia scelta** |
| GRAZE (schivata) | ~62 | Scartata: non passa la regola desktop di r/WebGames |
| CALIBRO (puzzle quotidiano) | ~60 | Scartata |
| Pacer Trace (traccia col dito) | ~55 | Scartata: non passa la regola desktop |
| Sway (torre a fisica) | ~52 | Scartata |

**Il punteggio non ha deciso, e la revisione avversariale ha spiegato perché.** L'asse
monetizzazione pesa 20 punti su 100, ma tutte e quattro le ricognizioni concludono che il ricavo di
oggi è 0 EUR per **qualsiasi** idea, con gli stessi identici blocchi. Assegnare 12/20 a una e 5/20 a
un'altra per una proprietà che nessuna delle due possiede è inflazione arbitraria. Azzerando quell'asse
per tutti: BANCA 60, OFF BY 57, GRAZE 57, CALIBRO 56, Pacer 53, Sway 52 — il vantaggio di BANCA passa
da 8 punti a 3, cioè rumore.

**Perché BANCA è stata scartata nonostante il punteggio più alto:**
1. *Contraddizione strutturale.* Prometteva insieme "stesso ordine di carte per tutti oggi" e "restart
   in mezzo secondo". Con informazione nascosta + ordine fisso + replay istantaneo, il mazzo si
   memorizza in 3–4 partite e il gioco è risolto.
2. *Difetto economico.* Nome "BANCA", meccanica cash-out, iconografia carte: esattamente il campo
   semantico che fa scattare la classificazione *social casino* presso le ad network e i portali
   curati — cioè gli unici canali che un giorno pagherebbero.

## 6. La tesi

> Per chi ha **sessanta secondi e una mano sola**, NERVE offre una decisione secca e ripetuta —
> bancare il sicuro o inseguire l'oro — con un verdetto leggibile all'istante e un colpevole sempre
> chiaro: sei stato tu a tenere premuto troppo. Lo distribuiamo via **link HTTPS diretto** su
> r/WebGames (la meccanica premi-e-rilascia funziona col mouse, quindi supera la regola P7 che taglia
> fuori i candidati basati su schivata e tracciamento). **Non lo monetizziamo oggi**, perché nessuna
> rete è attivabile e montare un tag popunder farebbe rimuovere il post bruciando slot non
> rinnovabili. Il rischio maggiore è che la meccanica, senza taratura su un telefono fisico, risulti
> frustrante invece che tesa — mitigato con 2.500 corse simulate per profilo di abilità, ma
> **non eliminato**.
