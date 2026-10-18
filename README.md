# Borgo delle Creature

**F02 implementata** sulla baseline FIRST_PLAYABLE: acquisti multipli, traguardi automatici, talenti e lista operativa nel Borgo. Un quartiere, quattro attività, tre creature, tre progetti e la prima festa; produzione offline fino a 48 ore. Nessun account, backend o API runtime.

Stato attuale e verifiche: [docs/FLOW_IMPLEMENTATION_REPORT.md](docs/FLOW_IMPLEMENTATION_REPORT.md). FIRST_PLAYABLE e F02 sono integrati in `main`. Nessun deploy. Il report FIRST_PLAYABLE rimane storico.

La grafica è un **fallback SVG originale e provvisorio**, a strati. Il riferimento illustrato in `docs/art/concept-reference.jpg` resta la direzione per i raster definitivi: il fallback non li sostituisce come stile approvato.

## Avvio locale

Node **22.12+ della serie 22, 24.x oppure 26+** e npm. Ambiente verificato: Windows, PowerShell, Node 26.7.0, npm 11.19.0. `.nvmrc` indica la versione esatta usata. Il lockfile è incluso.

```powershell
git clone https://github.com/margulka93-lab/idle-creature.git
cd idle-creature
git switch main
npm ci
npm run dev
```

Aprire [http://127.0.0.1:5173](http://127.0.0.1:5173). Mantenere aperto il terminale; Ctrl+C arresta il server. La porta 5173 deve essere libera.

```powershell
npm run typecheck
npm test
npm run simulate
npm run build
npm run preview
```

La preview della build è su [http://127.0.0.1:4173](http://127.0.0.1:4173). Non aprire `index.html` direttamente con `file://`. Le Web Locks richiedono un contesto sicuro, disponibile su localhost. Le partite di dev e preview sono separate perché hanno porte/origini diverse.

## Come giocare

- Parti con 25 monete, Orto L1 e Momo al lavoro. Le attività possedute producono anche senza creature e senza raccogliere prodotti.
- Nel **Borgo** confronti tutte le attività e compri direttamente dalle righe, con un click senza selezione preventiva. Tap sulla scena o **Dettagli** apre l’inspector facoltativo.
- Il selettore condiviso ricorda la preferenza separatamente dalla partita: **PROSSIMO** è il default, compra esattamente fino al prossimo L10/L25/L50; **+1** compra un livello; **+10** tutto il blocco (massimo L50) e resta disabilitato se non basta il saldo; **MAX** compra quanti livelli puoi sostenere. Costruire resta una singola azione separata. Il costo è la somma esatta dei prezzi interi di ogni livello.
- Ai livelli **10/25/50** ogni attività raddoppia automaticamente la propria produzione: cumulativi ×2/×4/×8. Nessun pulsante per riscuotere. La riga mostra target, costo, produzione passiva prima/dopo e soglie incluse; i bonus temporanei sono indicati separatamente.
- **Incoraggia** dà +50% per 30 secondi alla creatura assegnata. Puoi anche premere e trascinare intenzionalmente sulle creature. Il gesto inizia dopo 8 pixel; il semplice passaggio del mouse non attiva nulla.
- Su telefono trascina nella scena; scorri la pagina **fuori dalla scena** per raggiungere inspector e comandi. La scena ha altezza contenuta, senza camera libera.
- Tastiera: Tab/Shift+Tab per spostare il focus; Invio/Spazio sui pulsanti; frecce nei menu di assegnazione. Nessun gesto è obbligatorio: usa Incoraggia e Raccogli prodotto anche dalla lista.
- Ogni attività matura un prodotto in 3 minuti, massimo uno pronto, senza scadenza. Raccoglilo nella scena o nell’inspector.
- Le creature crescono automaticamente lavorando. A **L5** aggiungono +10% nell’attività preferita; a **L10/L20** le carezze successive durano 45/60 secondi. Un bonus già in corso conserva la scadenza. In **Creature** o nei dettagli puoi riassegnare gratuitamente o mettere a riposo; una sola creatura per postazione.
- Acquista Vivaio → Nibi; Sentiero richiede Orto L10 e apre Mulino/Meraviglie; Mulino → Tula; Ponte richiede Orto/Vivaio/Mulino L10 e apre Laboratorio/giardino; Festa richiede tutte le attività L25 e tutte le creature L5. Restano i costi monetari/cristalli v1. Checklist e progetto successivo sono nel Borgo, oltre alla sezione **Progetti**. I progetti già completati in v1 restano completati.
- I cristalli arrivano dai traguardi della produzione totale; spendere monete non azzera quei progressi. **Collezione** mostra le tre specie effettive.

## Salvataggi e più schede

Il gioco salva in `localStorage`, chiave compatibile `borgo-creature.save.v1`, ogni 5 secondi, dopo le azioni e al passaggio in background/uscita. Al ritorno riconcilia una sola volta tempo, bonus, XP, cristalli e prodotti; sopra 48 ore scarta il tempo eccedente. Dopo almeno 60 secondi appare un **banner non bloccante**, espandibile: puoi comprare subito, e nasconderlo non accredita nuove risorse.

I nuovi export hanno `schemaVersion: 1` e **`economyVersion: 2`**. Un JSON legacy senza economyVersion (o con 1) viene riconciliato fino all’istante dell’aggiornamento con il motore v1 originale; da quell’istante usa v2, senza ricalcolare monete o XP passati. La prima copia pre-F02 è conservata in `borgo-creature.pre-f02.v1`, esportabile dalle Impostazioni. Se scrivere il backup fallisce, il gioco continua in memoria con avviso e copia esportabile, senza sovrascrivere il save originale. Import ripetuti sostituiscono la partita dopo conferma, non sommano entrate alla partita corrente. Le versioni economiche future sono rifiutate recuperabilmente.

Apri **Impostazioni** in alto per esportare JSON, importare un file o incollare JSON. Import e reset richiedono conferma prima di sostituire la partita. L’export include versione dello schema e `lastSimulatedAt` in millisecondi UTC. Conserva una copia fuori dal browser prima di cancellare i suoi dati.

Un salvataggio corrotto o di versione sconosciuta blocca l’avanzamento e resta conservato, con export dei dati originali e reset esplicito. Se possibile è copiato anche in `borgo-creature.save.v1.recovery`. Se lo storage è negato, si gioca in memoria con avviso persistente: esporta prima di uscire.

Una Web Lock rende una sola scheda proprietaria della partita. Le altre mostrano dati salvati e restano in sola lettura: non avanzano né scrivono. Dopo aver chiuso la proprietaria, usa **Riprova dopo aver chiuso l’altra scheda**. Non si sottrae una lock a una scheda ancora aperta. Browser privi di Web Locks restano in sola lettura con messaggio; usare un browser aggiornato.

## Verifiche riproducibili

```powershell
npx playwright install chromium
npm run test:e2e
```

Il comando costruisce anche la versione di produzione e avvia temporaneamente dev (5173) e preview (4173). Esegue Chromium a 1440×900, mobile emulato 390×844 e 360×800, con input touch tramite protocollo Chromium. Non richiede server avviati a mano. Per isolare un profilo: `npm run test:e2e -- --project=mobile390`.

Evidenze F02: **38 unit test**, **50 E2E superati + 1 test touch non applicabile al desktop**, otto simulazioni comparative v1/v2 fino a 24 ore. Dettagli e limiti in [docs/FLOW_IMPLEMENTATION_REPORT.md](docs/FLOW_IMPLEMENTATION_REPORT.md); dati numerici in [docs/flow-simulation-results.json](docs/flow-simulation-results.json). `npm run simulate` esegue il confronto attuale; `npm run simulate:v1` riproduce la vecchia simulazione FIRST_PLAYABLE usando il motore congelato.

Screenshot reali catturati dai test browser, a pagina intera:

- [Desktop: traguardo](docs/screenshots/f02/desktop-traguardo.png) · [ritorno](docs/screenshots/f02/desktop-ritorno.png)
- [Mobile 390: traguardo](docs/screenshots/f02/mobile390-traguardo.png) · [ritorno](docs/screenshots/f02/mobile390-ritorno.png)
- [Mobile 360: traguardo](docs/screenshots/f02/mobile360-traguardo.png) · [ritorno](docs/screenshots/f02/mobile360-ritorno.png)

Nella stessa cartella ci sono gli screenshot di inizio ed evoluzione F02; quelli FIRST_PLAYABLE restano nella cartella superiore come evidenza storica.

Non sono prove su telefoni fisici o Safari/Firefox, né un playtest umano di divertimento. Gli E2E controllano il tempo con il clock browser: non attendono ore reali.

## Diagnostica e struttura

Solo con `npm run dev`, apri `/?debug=1`: salti di 60s/1h/48h, reset con conferma e sblocchi di test. Tutti usano `advance` e i comandi ordinari. Gli sblocchi avanzano 24 ore, poi due visite da un’ora per comprare attività, traguardi e progetti secondo i nuovi requisiti: non creano una valuta alternativa. Il clock di prova resta spostato fino al reset; usa una partita separata o riparti da zero dopo i test. Il pannello e le sue azioni non esistono nella build di produzione, anche con `?debug=1`.

- `src/core`: motore v2, quote e checklist indipendenti da React/DOM; `legacy-v1.ts` congela il codice originale per migrazione e confronto.
- `src/content`: configurazione effettiva = fondamento numerico invariato di `design/balance.v1.json` + regole F02 di `design/flow.v2.json`; nessun tuning numerico o copia divergente. `legacy.ts` legge solo v1; riferimenti artistici nel manifest.
- `src/persistence`: validazione, recupero e adapter storage.
- `src/ui`: controller unico, lock, clock, pannelli e CSS responsive.
- `src/scene`: renderer a strati e intersezione segmenti/hitbox.
- `public/assets`: fondale, edifici e creature SVG locali; sostituibili tramite `src/content/art-manifest.json`.
- `tests`: motore/persistenza/geometria ed E2E; `scripts/simulate.ts`: politiche di visita ripetibili.

Prezzi e quantità di cristalli baseline invariati; formule di produzione e gate sono v2. Niente combattimento, fame, gacha, monetizzazione, prestigio, riproduzione, multiplayer o sistemi della roadmap futura. Dopo la Festa il borgo produce ancora; il messaggio «Prototipo completato» esplicita la fine del contenuto.

## Guida illustrata

[Le tre tavole del primo borgo](docs/GUIDA_VISIVA.md): scelte, interazioni, crescita, sblocchi e progresso offline. Le tavole sono concept esplicativi; per le regole aggiornate prevalgono F02 e il codice corrente.
