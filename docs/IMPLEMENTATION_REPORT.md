# FIRST_PLAYABLE — report di implementazione

> Report storico del commit 8ae73a6. Per il runtime attuale vedere [F03_IMPLEMENTATION_REPORT.md](F03_IMPLEMENTATION_REPORT.md), con [F02 storico](FLOW_IMPLEMENTATION_REPORT.md); risultati e verifiche qui sotto appartengono alla baseline v1.

Verifica del 18 ottobre 2026. Branch `codex/first-playable`, destinazione PR `main`. Nessun merge o deploy. Specifiche lette nell’ordine di AGENTS.md; nessun codice o asset importato da altri giochi.

## Consegna e scelte

Realizzati motore, dati, salvataggi, scena e quattro sezioni reali in React/TypeScript/Vite. Quattro attività acquistabili/migliorabili fino a L50, tre creature fino a L20, tre progetti istantanei, conclusione e produzione successiva. Il giardino rivelato è decorativo, come da scope: non introduce una quinta attività.

`advance` integra i confini di crescita e scadenza dei bonus, mantenendo monete frazionarie. Cristalli e prodotti vengono risolti analiticamente, senza loop per ogni secondo. Ogni comando riconcilia prima il tempo, verifica nuovamente risorse/prerequisiti e applica la mutazione atomica. La stessa funzione è usata da tick 4Hz, load, background, debug e simulazioni.

Il controller sospende i tick in background, riconcilia/salva all’uscita e al ritorno. Web Locks garantisce una sola scheda scrivente; un token di generazione protegge inizializzazione asincrona e cleanup, anche con **React StrictMode effettivamente attivo**. Riepiloghi e stato dei pannelli non sono sorgenti di guadagno.

Art direction implementata con **fallback SVG originale**, non arte raster definitiva: paesaggio a terrazze, vegetazione, acqua e giardino fermi; quattro edifici separati; tre creature separate con silhouette crema/foglie, lilla/orecchie e turchese/guscio. Respiro, gesto di lavoro lieve e reazione al tocco sono CSS locali sulle sole creature; reduced motion li disabilita. Nessuna emoji usata come creatura, nessuna immagine del concept ritagliata, nessuna risorsa remota runtime. Manifest con dimensioni, pivot, scala e margine hitbox pronto alla sostituzione degli asset.

## Ambiente e comandi eseguiti

Windows / PowerShell, Node **26.7.0**, npm **11.19.0**. React 19.3.1, TypeScript 5.9.3, Vite 7.3.7, Vitest 5.0.5, Playwright 1.64.1; versioni esatte nel lockfile. Chromium for Testing **156.0.8078.4**, build Playwright 1248, installato per queste verifiche. Supporto dichiarato Node serie 22 da 22.12, serie 24 e da 26, secondo engines dei tool; le altre versioni non sono state eseguite qui.

| Comando | Esito realmente osservato |
| --- | --- |
| `npm install` e installazione tool | Dipendenze installate, lockfile incluso |
| `npx playwright install chromium` | Chromium e headless shell installati |
| `npm run typecheck` | Superato; ripetuto anche da `npm run build` |
| `npm test` | 1 file, **24 test superati** |
| `npm run build` | TypeScript e Vite superati; bundle JS circa 260 kB, circa 81 kB gzip |
| `npm run test:e2e` | **35 superati, 1 saltato**: il caso touch è escluso dal solo profilo desktop |
| `npm run simulate` | Due politiche 24h e percorso essenziale senza bonus, nessun NaN/saldo negativo/deadlock |
| `npm audit` | Nessuna vulnerabilità nelle dipendenze finali |
| `git diff --check` | Nessun errore di whitespace |

La prima versione dei tool di test aveva advisory transitivi; Vitest è stato aggiornato a 5.0.5 prima della consegna. Le prime esecuzioni E2E hanno individuato sovrapposizione tra hitbox creature/postazioni e perdita del gesto al trasferimento della pointer capture. Correzioni: creature spostate leggermente di lato, gestione del lost capture sul solo puntatore guida e tap risolto su pointerup, mantenendo click da tastiera. La suite finale verifica questi percorsi. Un errore iniziale nel test multischeda proveniva dall’installazione del clock, condiviso nel contesto Playwright: il test ora fa trascorrere l’ora solo dopo la chiusura della proprietaria.

## Accettazione

| # | Esito | Evidenza |
| --- | --- | --- |
| 1 | Superato | Installazione, dev, build, typecheck e unit test; installazione pulita via `npm ci` verificata prima della consegna. Avvio browser automatico e istruzioni README. |
| 2 | Superato | Test partenza: 25 monete, lifetime 0, Orto L1, Momo assegnato, altri L0, tasso 0,65/s. Borgo L1 derivato da zero progetti. |
| 3 | Superato | Unit test monete frazionarie, upgrade, costo L1=25, fondi insufficienti, doppio acquisto, prerequisiti, L50; E2E primo upgrade e reload. Beneficio reale mostrato. |
| 4 | Superato | Test bonus ×1,5/30s, throttle 500ms e rinnovo sostitutivo; E2E hover senza bonus, swipe in un solo segmento attraverso due creature, selezione invariata e Invio su Incoraggia. |
| 5 | Superato in emulazione | Input touch via CDP su 390/360: scroll esterno senza carezze, drag scena senza scroll pagina, tap prima e dopo drag; pointercancel e puntatore secondario ignorato. Nessun acquisto sul gesto. |
| 6 | Superato | Unit test prerequisito Sentiero, 20s, cooldown 300s, fattore combinato ×2 e scadenza; browser abilita/disabilita il pulsante e i timer. Stato persistito include entrambe le scadenze. |
| 7 | Superato | Prodotto a 179/180s, congelamento, raccolta unica, premio sul tasso senza boost e zero XP; browser raccolta dalla scena; offline massimo uno per attività. |
| 8 | Superato | Crescita al confine XP, più livelli, cap L20; riassegnazione dopo riconciliazione, occupata rifiutata, bonus segue la creatura senza duplicazione. Browser sposta Momo e Nibi su attività reali. |
| 9 | Superato | Tutti i traguardi una volta, 28 cristalli totali e 23 spesi, residuo 5; sequenza completa testata nel motore, in simulazioni passive e tramite UI da partita iniziale senza seed/debug. |
| 10 | Superato | Test 0/60s/1h/48h/72h, cap senza recupero del tempo scartato, tempo negativo/NaN/infinito, idempotenza, molti partizionamenti, online 250ms vs offline, bonus residui e cooldown. Browser load, riepilogo, reload e background senza doppio accredito. |
| 11 | Superato | Round trip JSON; rifiuto di numeri/ID/livelli/assegnazioni/premi incoerenti e versioni sconosciute. Browser export, import con conferma, reset annullato/confermato, corrotto conservato, storage negato e memoria, due tab e takeover esplicito. |
| 12 | Superato nei browser eseguiti | Chromium desktop 1440×900, mobile emulato 390×844 e 360×800. Quattro pannelli, inspector, focus da tastiera e reduced motion. Assert nessun overflow orizzontale; screenshot a pagina intera. Nessun dispositivo fisico usato. |
| 13 | Superato con fallback dichiarato | Asset locali, scene e creature separate; screenshot realmente ispezionati. Test ascoltano errori JS/console nel percorso iniziale ed errori JS/HTTP nella scena evoluta: nessuno osservato. Il concept illustrato non è stato consegnato come arte finale. |
| 14 | Superato tecnicamente, bilanciamento da playtest | JSON riproducibile delle due politiche e analisi sotto. Nessun ritocco numerico. Il primo progetto non richiede oltre 30 minuti con visite frequenti; i check-in radi lo rinviano a 1h. |
| 15 | Superato | README, report, simulazioni e sei screenshot inclusi. Branch e commit dedicati, PR senza merge/deploy. |

## Simulazioni

Fonte: `docs/simulation-results.json`, generata da `npm run simulate`, clock iniziale esplicito e contenuti del JSON originale. Nessuna modifica a `design/balance.v1.json`.

Politica comune: check-in a **0/1/4/8/24h**. Prima tenta progetti e nuove attività fino a esaurire gli acquisti validi; poi investe in upgrade ordinati per produzione passiva marginale/costo, ricalcolando dopo ciascun acquisto. Nessun acquisto automatico durante l’assenza. La passiva non incoraggia e non raccoglie. L’attiva aggiunge una finestra di **180s** a 0/1/4/8h con carezze/raccolta/Meraviglie ogni 15s se disponibili, e nessun input il resto del tempo. A 24h si investe e si registra il risultato, senza simulare una finestra oltre l’orizzonte. Gli snapshot intermedi attivi sono a fine finestra; il JSON conserva questa distinzione.

| Risultato a 24h | Passiva | Attiva |
| --- | ---: | ---: |
| Monete complessivamente prodotte, inclusi prodotti raccolti | 16.207.064,500 | 16.299.500,008 |
| Saldo dopo gli investimenti | 10.488.517,500 | 10.580.953,008 |
| Tasso finale senza boost | 257,996/s | 257,996/s |
| Attività | tutte L50 | tutte L50 |
| Creature | tutte L20 | tutte L20 |
| Vivaio / Nibi | 1h | 1h |
| Sentiero / Mulino / Tula | 1h | 1h |
| Ponte / Laboratorio / Festa | 4h | 4h |
| Cristalli residui dopo tutti i progetti | 5 | 5 |

Vantaggio attivo: **92.435,508 monete, +0,57034%** di produzione totale. Il risultato piccolo deriva da finestre attive brevi, check-in radi e convergenza agli stessi limiti di livello; non dimostra che il gesto sia abbastanza gratificante. I bonus non sono prerequisiti di sblocco.

Controllo aggiuntivo di raggiungibilità: visite ogni minuto, solo upgrade iniziale dell’Orto, poi risparmio per il percorso essenziale; nessun incoraggiamento, prodotto o Meraviglia. Vivaio al **minuto 3**, Sentiero al **6**, Mulino al **9**, Ponte e Laboratorio al **25**, Festa al **36**. Non c’è un’attesa strutturale >30 minuti per il primo progetto. Il Sentiero a 1h nelle politiche principali dipende dalla scelta di non effettuare visite prima.

A livello uguale l’Orto ha il migliore rendimento marginale iniziale per costo: 0,455/25 = 0,0182 monete/s per moneta investita, contro Vivaio 0,65/60 ≈ 0,0108, Mulino 1,3/150 ≈ 0,0087 e Laboratorio non assegnato 2/400 = 0,005. La crescita esponenziale del costo sposta progressivamente gli investimenti e i prerequisiti obbligano nuove attività. A L50 i contributi sono Orto 29,652/s, Vivaio 42,504/s, Mulino 84,84/s e Laboratorio 101/s: il Laboratorio pesa circa il 39% del totale. Sono asimmetrie della baseline da osservare in playtest, non motivi per aggiungere sistemi. Non è stata fatta una ricerca dell’ottimo economico.

## Browser, schermate e limiti

Sei screenshot reali a pagina intera, generati dalla suite: `docs/screenshots/desktop-inizio.png`, `desktop-borgo.png`, `mobile390-inizio.png`, `mobile390-borgo.png`, `mobile360-inizio.png`, `mobile360-borgo.png`. “Inizio” è la partita normale dopo circa due minuti di clock controllato, carezza e primo upgrade; “borgo” è uno stato evoluto caricato come fixture, poi interagito con raccolta, Meraviglie, assegnazioni e pannelli. Il percorso completo senza fixture è verificato separatamente. Le immagini possono includere feedback temporaneo dell’ultima azione.

Limiti residui:

- Arte provvisoria SVG, più semplice e meno pittorica del concept: raster illustrati definitivi non prodotti/validati. Nessun blink articolato perché gli occhi non sono separati. Nessuna limitazione artistica blocca le meccaniche della slice.
- Mobile è **emulazione Chromium**, con input touch browser reale tramite CDP, non prova su hardware Android/iOS; Safari/Firefox e screen reader non eseguiti. Il test background usa la visibilità controllata; la sospensione reale del sistema operativo non è stata osservata per 48 ore.
- La slice si conclude: raggiunti i cap, le monete si accumulano senza ulteriori spese. Espansioni e nuovi sistemi restano fuori scope. Bilanciamento e piacere delle visite richiedono playtest umano; le simulazioni provano raggiungibilità e coerenza.
- Salvataggio solo locale, senza sincronizzazione tra dispositivi/origini. Web Locks necessaria: browser senza supporto o contesto non sicuro danno sola lettura; storage negato dà partita in memoria con avviso. Export/import è il trasferimento previsto.
- Diagnostica di sviluppo sposta il timestamp: non mischiare partite di prova e partite normali; eseguire reset esplicito dopo salti futuri.

Nessun blocco ambientale residuo per motore, UI, installazione, browser o consegna Git. Non registrato alcun video.
