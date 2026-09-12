# MISSION — Hackathon Night

## Tempi (assoluti, NON rinegoziabili)
- **Inizio:** 2026-09-12 10:00:00 CEST (2026-09-12T08:00:00Z) — sabato
- **Scadenza:** 2026-09-12 18:00:00 CEST (2026-09-12T16:00:00Z)
- **Durata:** 8h 00m — il *tetto massimo di 8 ore dall'avvio* prevale sulla "prima occorrenza delle 08:00"
  (che sarebbe stata 2026-09-13 08:00, a 22 ore di distanza).
- Congelata. Una compattazione o ripartenza NON la sposta.

> **Nota di correzione (10:06 CEST).** La prima lettura di `date` nell'ambiente ha restituito
> `02:58:06 CEST`, valore errato. Verifica incrociata su due fonti di rete indipendenti
> (header `Date` di google.com e api.github.com, entrambi `Sat, 12 Sep 2026 08:05 GMT`) e sul
> timestamp di push di un repo (`2026-09-12T08:04:50Z`) conferma l'ora reale. Parametri ricalcolati
> una sola volta, all'accertamento del dato, e da qui congelati.

### Tappe derivate (% della durata)
| % | Ora CEST | Fase |
|---|---|---|
| 0–15% | 10:00 → 11:12 | Accessi, ricerca, scelta, ipotesi economiche |
| 15–30% | 11:12 → 12:24 | Prototipo giocabile + prima revisione |
| 30–60% | 12:24 → 14:48 | Sviluppo, rifinitura, deploy stabile |
| 60–80% | 14:48 → 16:24 | Lancio, distribuzione, campagne se ammissibili |
| 80–95% | 16:24 → 17:36 | Misurazione e correzioni mirate |
| 95–100% | 17:36 → 18:00 | Riconciliazione economica e consegna |

## Budget
- **Massimo assoluto: 100,00 EUR** di NUOVE spese incrementali.
- Include: pubblicità, dominio, hosting, asset, API, subagenti a consumo, commissioni, imposte.
- **Esclusione dichiarata:** gli abbonamenti già pagati dal titolare (es. Claude/Claude Code, GitHub)
  NON sono nuove spese e non vengono conteggiati. Nessun nuovo abbonamento viene attivato.
- Registro persistente: `BUDGET.json`.

## Autorizzazioni (da prompt del titolare)
- Sviluppo, deploy e spese strettamente necessarie al progetto, entro 100 EUR.
- Solo account/credenziali messi a disposizione per questo progetto.
- NON autorizzato: toccare altri progetti, campagne esistenti, impostazioni estranee.
- NON autorizzato: inventare identità, dati fiscali o approvazioni; aggirare autenticazione o verifiche.

## Risorse verificate all'avvio (2026-09-12 ~10:00 CEST)
| Risorsa | Stato |
|---|---|
| Node | v24.19.0 ✅ |
| npm / pnpm | 11.17.0 / 11.25.0 ✅ |
| git | 2.50.1 ✅ |
| GitHub CLI | 2.94.0, autenticato **account personale `fedeinfe`**, scopes `gist, read:org, repo, workflow` ✅ |
| Rete | api.github.com 200, registry.npmjs.org 200 ✅ |
| Browser automatizzato | Claude Browser (in-app) ✅ |
| Subagenti / Workflow | disponibili ✅ |
| vercel / netlify / wrangler CLI | assenti ❌ |
| ffmpeg / ImageMagick | assenti ❌ |
| Account AdSense / ad network | **non verificato all'avvio — da accertare** |
| Carta di pagamento utilizzabile dall'agente | **nessuna nota** |
| Dominio registrato | nessuno |

## Isolamento
- Progetto **non** collegato a Civico/ProAF. Identità usata: GitHub personale `fedeinfe`.
- Directory di lavoro dedicata; nessun file preesistente sovrascritto.
- Fonte di verità durevole: repository GitHub pubblico (la cartella di sessione è effimera).

## Definizione di successo (separata, non confusa)
1. Prodotto pubblicato e giocabile su URL HTTPS verificato.
2. Utenti reali acquisiti (distinti dai test).
3. Monetizzazione approvata e operativa.
4. Ricavi pubblicitari osservati.
5. Profitto dopo i costi.
6. Denaro effettivamente liquidato.

Nessuno di questi viene dichiarato senza prova.
