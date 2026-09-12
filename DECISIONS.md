# DECISIONS — scelte principali e perché

## D1 · Scadenza ricalcolata una sola volta, poi congelata
**10:06 CEST.** La prima lettura di `date` ha restituito `02:58 CEST`, valore errato. Verifica
incrociata su due header `Date` HTTP indipendenti (google.com, api.github.com → `Sat, 12 Sep 2026
08:05 GMT`) e sul timestamp di push di un repo (`08:04:50Z`) ha stabilito l'ora reale.
La regola del titolare — prima occorrenza futura delle 08:00, **con tetto di 8 ore dall'avvio** —
produce due candidati: 2026-09-13 08:00 (22 ore) e 2026-09-12 18:00 (8 ore). **Vince il tetto.**
Scadenza: **2026-09-12 18:00 CEST**. Ricalcolata una volta sola, all'accertamento del dato.

## D2 · Gioco scelto: NERVE, famiglia timing di precisione
Vedi `RESEARCH.md §5–6`. Decisivi: la meccanica premi-e-rilascia **funziona col mouse su desktop**,
requisito di pubblicazione su r/WebGames che esclude i candidati basati su schivata e tracciamento;
e il candidato meglio piazzato a punteggio (BANCA) aveva una contraddizione strutturale fra seed
giornaliero e replay istantaneo, più un tema che si auto-esclude dai portali che un giorno pagano.

## D3 · La carica è ancorata all'orologio, non ai frame
`press`, `tick` e `release` prendono un timestamp; la carica deriva dai millisecondi trascorsi.
In un gioco di precisione il verdetto non deve mai dipendere da quanti frame sono stati disegnati:
su un telefono che perde frame il giocatore verrebbe punito per un difetto di rendering.
Emerso in QA: il browser automatizzato usato per i test strozza `requestAnimationFrame` a ~1 fps
pur dichiarando la pagina visibile. Un test copre il caso "tick in forte ritardo".

## D4 · Il pavimento di lealtà è sul tempo, non sulla larghezza dell'arco
Prima versione: pavimento sulla larghezza (0.095). Con i modificatori moltiplicativi, TEMPO scendeva
a **73 ms** — sotto la soglia oltre la quale nessun giocatore può anticipare la finestra.
Ora il pavimento è `(85ms/1000) × rate`: vale **per costruzione** su ogni modificatore, invece di
sperare che i moltiplicatori si compensino. Un test verifica tutte e sei le curve.

## D5 · Il daily è diventato una sfida davvero diversa
**Correzione da revisione avversariale.** Il seme influenzava solo `goldStart`, cioè *dove* cade la
banda d'oro — che però è disegnata a schermo. La difficoltà di oggi era identica a quella di domani:
la "daily" era la stessa sfida con un offset invisibile, e la meta description la dichiarava.
Era una funzione che esisteva solo nella UI.
Ora il giorno seleziona uno di cinque modificatori (STEADY, TEMPO, HAIRLINE, DRIFT, SURGE) che
cambiano velocità dell'anello, spessore dell'oro, quanto la banda si sposta fra round e quanto in
fretta stringe. Il nome del modificatore è **dichiarato in schermata**.

## D6 · La chiave del giorno è in UTC
Era in ora locale, con tanto di commento che lo giustificava. Due amici in fusi diversi avrebbero
confrontato corse diverse credendo fosse la stessa — che distrugge esattamente ciò che rende
condivisibile un punteggio giornaliero.

## D7 · Nessun tag pubblicitario. `src/ads.js` resta spento
Il valore atteso di montare annunci oggi è **negativo**, non nullo:
- ricavo atteso 0,00 EUR (zero traffico, nessun account attivabile);
- i formati disponibili a un publisher nuovo sulle reti rapide sono popunder/push, e r/WebGames
  pretende link diretti: un popunder è il modo più affidabile di farsi rimuovere il post e bruciare
  uno slot non rinnovabile (r/playmygame: 1 post al mese);
- CrazyGames vieta gli ads esterni, quindi un tag oggi pregiudica il canale che domani potrebbe pagare;
- renderebbe **falsa** la `privacy.html` già pubblicata.

`src/ads.js` è un'astrazione disattivata che risolve sempre `{shown:false}`: il gioco funziona
identico con annunci spenti, falliti o bloccati. È lavoro **finito**, non un segnaposto.

## D8 · Budget chiuso a 0,00 EUR — spendere avrebbe avuto rendimento atteso negativo
Con ricavo 0,00 EUR in ogni ramo, il profitto è esattamente *meno* la spesa.
- **Acquisizione → 0 EUR.** TikTok impone 50 USD/giorno minimo per campagna; Reddit e Meta
  richiedono carta valida più review dell'account. Con 50 EUR non si comprano né utenti né
  apprendimento statisticamente leggibile.
- **Dominio → 0 EUR.** Mitigherebbe un rischio di termini d'uso che **sparisce da solo** non montando
  annunci. Comprarlo significherebbe chiudere a −11/−15 EUR con ricavo 0: perdita certa.
  Diventa sensato solo *dopo* che esista traffico reale.
- **Asset → 0 EUR.** Tutta la grafica è generata in codice; l'audio è sintetizzato in WebAudio.
  Nessun file di terze parti nel bundle.

Conservare il budget davanti a evidenze negative è la decisione corretta, non una rinuncia.

## D9 · Due modalità, non una
La revisione prodotto chiedeva di tagliare a una sola modalità; la revisione economica di tenere
endless come motore delle sessioni per visita. **Tenute entrambe:** condividono lo stesso codice e
differiscono per seme e modificatore, quindi il costo reale è un bottone in più, già costruito e
testato. Il daily è il gancio di ritorno, endless è il motore del rigioco immediato.

## D10 · Non pubblico io sulle community, e non creo account
Creare account, inserire credenziali e pubblicare contenuti a nome del titolare su community esterne
sono azioni che non eseguo di mia iniziativa. In più le regole anti-AI di quei subreddit richiedono
una dichiarazione veritiera su come il gioco è stato costruito: è una dichiarazione che deve fare il
titolare, con parole sue. Ho preparato il materiale in `LAUNCH.md`, pronto da incollare.

## D11 · Nessuna analytics finta
`src/analytics.js` accoda eventi finché non gli si assegna una destinazione. Collegare un contatore
senza cookie richiede un account che non posso creare. Invece di simulare misurazione, il codice è
predisposto con un unico punto di innesto documentato, e nella consegna la misurazione è dichiarata
**non attiva**. Conseguenza dichiarata: gli "utenti reali" non sono osservabili oggi.
