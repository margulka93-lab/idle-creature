# F03 — implementazione UX, grafica e verifiche

19 ottobre 2026. Branch `design/f03-visual-ux`, PR #4 verso `main`, baseline economica `ea31c4e`. Nessun merge/deploy, nessun progetto ricreato. Autorità lette: AGENTS.md, CODEX_TASK.md e docs/F03_VISUAL_UX.md, con F02 mantenuta per economia e persistenza. Il report F02 e i suoi screenshot restano storici.

## Implementazione effettiva

- Desktop 1440×900: scena circa 65% della zona principale e gestione 35%. Tutte le quattro righe, quantità condivisa e prossimo progetto nello stesso viewport. Nome/icona/livello, un tasso dominante e acquisto diretto; attività future distinte, motivo di blocco visibile. Nessun inspector necessario per acquistare.
- Mobile 390×844 e 360×800: header risorse/produzione, scena, dock per l’attività selezionata e nav inferiore. Quantità, upgrade, carezza, raccolta e accesso al progetto vicini alla scena. **Gestisci** apre il confronto delle quattro attività in un drawer: un tap per aprire, uno per comprare da qualsiasi riga, senza selezione intermedia. Selezionare un edificio o una creatura aggiorna il dock e non apre dettagli.
- Preview, dettagli, progetto e impostazioni sono dialoghi nativi aperti su richiesta, con chiusura/Esc e ripristino focus. Scroll interno e header di chiusura fermo. Ritorno offline tramite banner compatto, senza finestra automatica: acquisto immediato possibile.
- `+1/+10/PROSSIMO/MAX`, quote esatte, traguardi e preferenza locale invariati. Il nuovo **Puoi comprare +1** è un comando esplicito, senza cambiare la quantità selezionata. Prima/dopo passivi e soglie incluse sono nella preview; il tasso con bonus è distinto. Feedback aggregato locale per upgrade e costruzione; carezze senza toast ripetuti.
- Input pointer conservato: tap seleziona, trascinamento intenzionale dopo 8 px incoraggia ciascuna creatura attraversata una volta, prodotto raccoglibile separatamente. Nessun acquisto al rilascio. Tastiera e pulsanti equivalenti. Nessuno stato React per ogni pointermove; misurazione scena via ResizeObserver.
- Testo funzionale da 14 px, target ordinari almeno 44×44px. `100dvh`, safe-area e reflow con scorrimento verticale a dimensioni equivalenti allo zoom 200%. Colori delle scritte secondarie corretti dopo audit nel browser; focus visibile e bonus ancora leggibile con reduced motion.

### Perché il drawer mobile

La prima composizione con quattro righe permanenti non lascia spazio sufficiente: su 390×844 header/nav occupano circa 144 px, una scena con creature leggibili almeno 288 px, quantità 52 px e quattro righe circa 500 px richiederebbero già oltre 980 px senza progetto. Il [prototipo browser con quattro righe permanenti](screenshots/f03/prototype-mobile390-four-rows.png), marcato come variante scartata e costruito dai componenti reali, misura **1313 px** di documento su 844 px (include 40 px di didascalia). [Misure](f03-layout-prototype.json). Le prime catture desktop mostravano inoltre il progetto fuori vista, poi corretto. È stata scelta la gestione espandibile prevista dalla specifica, mantenendo l’acquisto selezionato immediato nel dock. A 390 le quattro attività entrano nella gestione senza scorrere per raggiungere la quarta; a 360 il percorso misurato richiede 34 px di scroll interno.

## Grafica realmente importata

Otto immagini originali generate con la capacità nativa e il primo concept come riferimento: fondale clean, quattro edifici e tre creature su alpha reale. Tutti i master sono stati ispezionati; esportazione proporzionale con Sharp e integrazione provata nel browser. [Prompt effettivi, dimensioni e stato artistico](art/f03/GENERATED_ASSETS.md), [audit alpha/export](art/f03/asset-audit.json).

Il manifest controlla dimensioni, pivot, scale, hitbox e ancoraggi normalizzati. Il fondale usa cover proporzionale e lo stesso spazio di coordinate degli asset, senza stiramenti. Gli ancoraggi mobile e un corridoio di raccolta separano personaggi e prodotti; il viewport limita i prodotti sui bordi. Le creature restano almeno 104 px di sprite/88 px di hitbox nei profili normali. Edifici, acqua e vegetazione fermi; respiro/oscillazione e reazione breve CSS, senza particelle o movimento nello scenario. Gli SVG F02 restano riserva: prova reale con richieste WebP abortite, senza modificare i master.

Le immagini sono **candidate integrate, non arte definitivamente approvata**. Non è stato prodotto un ciclo disegnato di blink o mani/piedi separati; i movimenti attuali agiscono sullo sprite intero. Non sono stati importati canone o asset di altri giochi. UI/testi sono HTML e gli screenshot seguenti sono catture dell’app, distinti dai PNG generati.

## File e responsabilità

- `src/ui/App.tsx`, `Activities.tsx`, `purchaseMode.tsx`, `Dialog.tsx`, `Details.tsx`, `Settings.tsx`, `format.ts`, `styles.css`: nuova struttura, comandi, pannelli e reflow; la vecchia ActivityList è sostituita.
- `src/scene/Scene.tsx` e `src/content/art-manifest.json`: importazione, geometria proporzionale, layout e hitbox.
- `src/ui/store.ts`: solo feedback locale di costruzione.
- `scripts`, `tests/e2e`, `docs/art/f03`, `docs/screenshots/f03`, `docs/recordings`: export, regressioni, misure ed evidenze. Sharp è una dipendenza di sviluppo; nessuna nuova dipendenza runtime.
- README/report corrente aggiornati; report F02 e sue evidenze conservati.

## Economia e salvataggi

Nessun tuning, schema nuovo, premio o reset aggiunto. `src/core`, `src/persistence`, `design/balance.v1.json` e `design/flow.v2.json` non hanno differenze rispetto alla baseline. L’unica modifica al controller è il feedback locale di costruzione: il comando e la persistenza restano gli stessi.

`npm run verify:economy` riesegue gli otto replay fino a 24 ore e confronta **tutti** gli eventi, snapshot e contrasti con il JSON F02, ignorando solo `generatedAt`: uguaglianza esatta. Controlla inoltre SHA256 normalizzati di sei file autoritativi. [Risultati](f03-economy-regression.json). Il JSON storico viene ripristinato dopo la prova.

Browser: reload, export/import, reset accettato/rifiutato, corrotto conservato, storage negato, backup pre-F02 negato/esportabile, versione futura rifiutata, migrazione v1 offline senza retroattività, import ripetuto idempotente, una sola scheda proprietaria/takeover e riconciliazione background senza doppio accredito. Contesti Playwright isolati: nessun salvataggio del browser personale è stato cancellato.

## Confronto UX eseguito nel browser

F02 è stato avviato da archivio Git di `ea31c4e` sulla porta 5174, F03 sulla 5173. Stessa nuova partita per ogni percorso e profilo, contesti separati, clock controllato. Script `scripts/compare-f03-ux.ts`, dati [f03-ux-comparison.json](f03-ux-comparison.json).

Nella tabella **tap / scorrimenti** conta gli input eseguiti e gli eventi di scroll automatico necessari a portare il target in vista; fra parentesi la posizione raggiunta in pixel. Non sono conteggi di swipe fisici umani o tempi osservati. Consultare il progetto F02 significa rendere visibile la checklist già aperta; F03 apre il pannello con un tap e lo richiude con un secondo tap o Esc.

| Percorso da nuova partita       | F02 desktop | F03 desktop | F02 mobile 390 | F03 mobile 390 | F02 mobile 360 | F03 mobile 360      |
| ------------------------------- | ----------- | ----------- | -------------- | -------------- | -------------- | ------------------- |
| Incoraggia Momo, pulsante       | 1/0         | 1/0         | 1/1 (463px)    | 1/0            | 1/1 (461px)    | 1/0                 |
| Primo livello, default PROSSIMO | 2/0         | 1/0         | 2/0            | 1/0            | 2/0            | 1/0                 |
| Cambia quantità a +10           | 1/0         | 1/0         | 1/0            | 1/0            | 1/0            | 1/0                 |
| Consulta prossimo sblocco       | 0/1 (450px) | 1/0         | 0/1 (891px)    | 1/0            | 0/1 (911px)    | 1/0                 |
| Raggiungi quarta attività       | 0/1 (29px)  | 0/0         | 0/1 (826px)    | 1/0            | 0/1 (824px)    | 1/1 (34 px interni) |

Altezza documento iniziale misurata: F02 desktop: 1350 px, mobile 390: 1735 px e mobile 360: 1711 px; F03 rispettivamente 900/844/800px. Il gesto su due creature resta un trascinamento; raccogliere un prodotto richiede un tap; apertura/chiusura del progetto due input senza cambiare selezione o posizione scena. L’acquisto selezionato ordinario è un tap; in un’altra attività dal drawer sono due tap incluso l’accesso a Gestisci. Queste misure descrivono il percorso automatizzato e il compromesso di spazio, non certificano divertimento o comprensione umana.

## Verifiche e correzioni

La suite browser preserva le regressioni F02 adattando i selettori ai dialoghi/drawer; aggiunge nuova partita, +1 esplicito con modalità stabile, preview esatta, focus durante i tick, due creature con gesto unico, raccolta separata, progetto richiudibile, ritorno discreto, quattro prodotti/tre creature con rettangoli disgiunti, dimensioni controlli, reduced motion, reflow e fallback reale.

Problemi trovati e corretti nel browser: righe troppo alte/progetto fuori vista desktop; prodotto sinistro tagliato dal cover mobile; sovrapposizione di pochi pixel prodotto/creatura a 360; spaziatura della terza creatura; comando Meraviglie nell’area di raccolta; etichette compresse a zoom 200%; colori secondari con contrasto insufficiente; feedback import nascosto dietro un dialogo modale. Aggiornati gli ancoraggi e semplificata la carezza mobile quando compare anche Raccogli.

L’audit calcola contrasto foreground/background delle superfici UI opache nella schermata iniziale, fuori dall’illustrazione; soglia 4,5:1 e font minimo 14px. [Dati](f03-accessibility-audit.json). Il reflow 200% è emulato dimezzando il viewport CSS (720×450,195×422,180×400), con scorrimento e controlli riposizionati. Non è una certificazione completa WCAG o un test del pinch/zoom di Safari.

Comandi realmente eseguiti: `npm ci`, `npm audit --audit-level=low`, `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e -- --max-failures=3`, `npm run simulate`, `npm run verify:economy`, `npm run assets:export`, `npx tsx scripts/audit-f03-accessibility.ts`, `npm run compare:ux`, `git diff --check`. **Esito finale: 38/38 unit test, 68 E2E superati e un test touch escluso dal solo desktop (69 casi su tre profili), build e typecheck riusciti, 8 replay economici identici a F02, audit dipendenze con zero vulnerabilità.** Dopo la suite completa, aggiunta e verificata la regressione dettagli→anteprima→Esc→Esc: **3/3 profili superati**, con nuova build/typecheck riusciti. Audit colori/font: nessuna violazione nei campioni della schermata iniziale sui tre profili.

La prima reinstallazione pulita ha incontrato EPERM su esbuild.exe tenuto aperto dai server Vite. Arrestati i server locali, `npm ci` è riuscito. Il sintetizzatore Chromium di scroll touch non spostava il pannello in questo ambiente: il test ora invia sequenze reali `Input.dispatchTouchEvent`, verificando effettivamente uno scroll positivo e nessun incoraggiamento. Le prove finali sostituiscono i tentativi intermedi falliti; non sono nascosti come successi.

Smoke test aggiuntivo sulla build di produzione, porta4173, a tutti e tre i formati: immagini caricate, acquisto +1 e salvataggio riusciti, debug assente anche con `?debug=1`, zero errori JavaScript/HTTP. Registrazione riprodotta in Chromium e controllata con seek: durata10,12s,390×844, nessun errore video. Verificati anche i link locali di README/report.

## Evidenze reali

| Profilo  | Nuova partita                                         | Due creature                                      | Soglia                                      | Progetto                                           | Ritorno offline                                  | Tre creature                                      |
| -------- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| 1440×900 | [inizio](screenshots/f03/desktop-nuova-partita.png)   | [due](screenshots/f03/desktop-due-creature.png)   | [L10](screenshots/f03/desktop-soglia.png)   | [progetto](screenshots/f03/desktop-progetto.png)   | [ritorno](screenshots/f03/desktop-offline.png)   | [tre](screenshots/f03/desktop-tre-creature.png)   |
| 390×844  | [inizio](screenshots/f03/mobile390-nuova-partita.png) | [due](screenshots/f03/mobile390-due-creature.png) | [L10](screenshots/f03/mobile390-soglia.png) | [progetto](screenshots/f03/mobile390-progetto.png) | [ritorno](screenshots/f03/mobile390-offline.png) | [tre](screenshots/f03/mobile390-tre-creature.png) |
| 360×800  | [inizio](screenshots/f03/mobile360-nuova-partita.png) | [due](screenshots/f03/mobile360-due-creature.png) | [L10](screenshots/f03/mobile360-soglia.png) | [progetto](screenshots/f03/mobile360-progetto.png) | [ritorno](screenshots/f03/mobile360-offline.png) | [tre](screenshots/f03/mobile360-tre-creature.png) |

[Registrazione mobile](recordings/f03-mobile.webm): scena reale con fixture da due creature, gesto touch, raccolta, acquisto, gestione quantità e progetto. Il clock è controllato e lo stato iniziale è preparato con i comandi del motore; non è un filmato di una partita umana o di tre minuti reali. Le catture L8/tre creature usano fixture deterministiche; la suite include anche nuova partita e percorso di sblocco completo attraverso la UI.

## Limiti residui

Chromium desktop/mobile emulato su Windows; nessun telefono fisico, Safari/Firefox, lettore di schermo o tastiera virtuale di un dispositivo reale. Safe-area gestite in CSS ma senza dispositivo con notch verificato. A zoom elevato il pannello scorre verticalmente; il test assicura accessibilità dei comandi, non la visibilità simultanea di tutto. La grafica richiede approvazione artistica umana; mancano animazioni disegnate per blink/lavoro. Serve playtest umano del flusso e, separatamente, del bilanciamento F02. Nessun blocco d’ambiente irrisolto per implementazione, asset o browser Chromium.
