# Borgo delle Creature

**F03 implementata** sulla base FIRST_PLAYABLE + F02: Borgo desktop con scena e quattro righe operative; mobile con dock immediato, gestione espandibile e navigazione inferiore. Economia, acquisti multipli, crescita e salvataggi restano F02. Un quartiere, quattro attività, tre creature, tre progetti, produzione offline fino a 48 ore. Nessun account, backend o API runtime.

Stato, misure e limiti: [report F03](docs/F03_IMPLEMENTATION_REPORT.md). Branch `design/f03-visual-ux`, [PR #4 verso main](https://github.com/margulka93-lab/idle-creature/pull/4), senza merge o deploy. [Report F02](docs/FLOW_IMPLEMENTATION_REPORT.md) conservato come storico.

Otto **illustrazioni originali separate sono integrate nel gioco**, con alpha reale su edifici e creature. Sono candidate in attesa di approvazione artistica, coerenti con il primo concept; gli SVG F02 restano riserva per errori di caricamento. [Master, prompt e importazione](docs/art/f03/GENERATED_ASSETS.md).

## Avvio locale

Node **22.12+ della serie 22, 24.x oppure 26+** e npm. Ambiente verificato: Windows, PowerShell, Node 26.7.0, npm 11.19.0. `.nvmrc` indica la versione esatta usata. Il lockfile è incluso.

```powershell
git clone https://github.com/margulka93-lab/idle-creature.git
cd idle-creature
git switch design/f03-visual-ux
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
- Su desktop confronti e compri dalle quattro righe accanto alla scena. Su mobile compri subito dal dock dell’attività selezionata; **Gestisci** apre le quattro righe con acquisti diretti. Il tap sulla scena seleziona; **Dettagli** e la freccia di anteprima aprono pannelli facoltativi.
- Il selettore condiviso ricorda la preferenza separatamente dalla partita: **PROSSIMO** è il default, compra esattamente fino al prossimo L10/L25/L50; **+1** compra un livello; **+10** tutto il blocco (massimo L50) e resta disabilitato se non basta il saldo; **MAX** compra quanti livelli puoi sostenere. Costruire resta una singola azione separata. Il costo è la somma esatta dei prezzi interi di ogni livello.
- Ai livelli **10/25/50** ogni attività raddoppia automaticamente la propria produzione: cumulativi ×2/×4/×8. Nessun pulsante per riscuotere. La riga mostra un tasso attuale dominante, target e costo. La freccia **Anteprima** mostra produzione passiva esatta prima/dopo e soglie incluse. Se il blocco selezionato costa troppo ma basta il saldo per un livello, **Puoi comprare +1** lo acquista esplicitamente senza cambiare modalità.
- **Incoraggia** dà +50% per 30 secondi alla creatura assegnata. Puoi anche premere e trascinare intenzionalmente sulle creature. Il gesto inizia dopo 8 pixel; il semplice passaggio del mouse non attiva nulla.
- Su telefono trascina nella scena; i comandi ordinari restano nel dock senza scroll lungo. Scorri dentro i pannelli di gestione/dettaglio. A zoom elevato anche il contenuto principale scorre e i controlli vanno a capo. Chiudi con il pulsante esplicito o Esc; il focus torna al comando di apertura.
- Tastiera: Tab/Shift+Tab per spostare il focus; Invio/Spazio sui pulsanti; frecce nei menu di assegnazione. Nessun gesto è obbligatorio: usa **Incoraggia** e **Raccogli prodotto** nei comandi selezionati, o nei dettagli della creatura.
- Ogni attività matura un prodotto in 3 minuti, massimo uno pronto, senza scadenza. Raccoglilo nella scena o nell’inspector.
- Le creature crescono automaticamente lavorando. A **L5** aggiungono +10% nell’attività preferita; a **L10/L20** le carezze successive durano 45/60 secondi. Un bonus già in corso conserva la scadenza. In **Creature** o nei dettagli puoi riassegnare gratuitamente o mettere a riposo; una sola creatura per postazione.
- Acquista Vivaio → Nibi; Sentiero richiede Orto L10 e apre Mulino/Meraviglie; Mulino → Tula; Ponte richiede Orto/Vivaio/Mulino L10 e apre Laboratorio/giardino; Festa richiede tutte le attività L25 e tutte le creature L5. Restano i costi monetari/cristalli v1. Il progetto successivo è apribile dalla riga desktop o dall’icona del dock mobile, oltre alla sezione **Progetti**. I progetti già completati in v1 restano completati.
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

Verifiche F03: **38 unit test, 68 E2E superati + 1 touch non applicabile al desktop**, build/typecheck riusciti, otto replay economici identici a F02. Il report contiene misure UX e limiti. Le simulazioni controllano il tempo; non sono sessioni umane di 24 ore. Chromium è emulato sui tre formati, senza dispositivi fisici o Safari/Firefox.

Screenshot reali dalla versione implementata:

- [Desktop: nuova partita](docs/screenshots/f03/desktop-nuova-partita.png) · [tre creature](docs/screenshots/f03/desktop-tre-creature.png) · [soglia](docs/screenshots/f03/desktop-soglia.png)
- [Mobile 390: due creature](docs/screenshots/f03/mobile390-due-creature.png) · [progetto](docs/screenshots/f03/mobile390-progetto.png) · [ritorno](docs/screenshots/f03/mobile390-offline.png)
- [Mobile 360: tre creature](docs/screenshots/f03/mobile360-tre-creature.png) · [soglia](docs/screenshots/f03/mobile360-soglia.png) · [zoom200 con fallback](docs/screenshots/f03/mobile360-zoom200-fallback.png)
- [Breve percorso mobile registrato](docs/recordings/f03-mobile.webm), input automatizzati nel browser con stato e clock di prova.

Per riprodurre l’esportazione tecnica degli asset: `npm run assets:export`. Per confrontare gli otto replay economici con F02: `npm run verify:economy`; ripristina il JSON storico dopo il confronto. `npm run simulate` continua a produrre la simulazione F02 originale.

Per le misure UX: avvia separatamente F02 da un archivio del commit `ea31c4e` sulla porta 5174 e F03 sulla 5173, poi `npm run compare:ux`. Lo script usa contesti browser isolati, salva il confronto e registra un breve percorso. Le azioni e gli scorrimenti misurati non sono stime dei tempi o dei gesti di utenti umani. Vedi [metodo e tabella](docs/F03_IMPLEMENTATION_REPORT.md).

Per preparare l’istanza F02 del confronto, in un terminale separato:

```powershell
git archive --format=zip --output=.qa-baseline.zip ea31c4e
Expand-Archive -LiteralPath .qa-baseline.zip -DestinationPath .qa-baseline
node node_modules/vite/bin/vite.js .qa-baseline --host 127.0.0.1 --port 5174 --strictPort
```

Con F03 già avviato sulla porta 5173, esegui `npm run compare:ux` in un altro terminale. `npx tsx scripts/audit-f03-accessibility.ts` ripete il controllo campionato di contrasto/font; `npx tsx scripts/capture-f03-prototype.ts` riproduce la composizione mobile scartata. Arresta i server prima di ripetere `npm ci` su Windows, per evitare lock su esbuild.exe.

## Diagnostica e struttura

Solo con `npm run dev`, apri `/?debug=1`: salti di 60s/1h/48h, reset con conferma e sblocchi di test. Tutti usano `advance` e i comandi ordinari. Gli sblocchi avanzano 24 ore, poi due visite da un’ora per comprare attività, traguardi e progetti secondo i nuovi requisiti: non creano una valuta alternativa. Il clock di prova resta spostato fino al reset; usa una partita separata o riparti da zero dopo i test. Il pannello e le sue azioni non esistono nella build di produzione, anche con `?debug=1`.

- `src/core`: motore v2, quote e checklist indipendenti da React/DOM; `legacy-v1.ts` congela il codice originale per migrazione e confronto.
- `src/content`: configurazione effettiva = fondamento numerico invariato di `design/balance.v1.json` + regole F02 di `design/flow.v2.json`; nessun tuning numerico o copia divergente. `legacy.ts` legge solo v1; riferimenti artistici nel manifest.
- `src/persistence`: validazione, recupero e adapter storage.
- `src/ui`: controller unico, lock, clock, pannelli e CSS responsive.
- `src/scene`: renderer a strati e intersezione segmenti/hitbox.
- `public/assets/f03`: fondale, edifici e creature WebP; SVG F02 in `public/assets` come riserva. Master PNG e prompt in `docs/art/f03`, dimensioni/pivot/ancoraggi nel manifest.
- `tests`: motore/persistenza/geometria ed E2E; `scripts/simulate.ts`: politiche di visita ripetibili.

Prezzi e quantità di cristalli baseline invariati; formule di produzione e gate sono v2. Niente combattimento, fame, gacha, monetizzazione, prestigio, riproduzione, multiplayer o sistemi della roadmap futura. Dopo la Festa il borgo produce ancora; il messaggio «Prototipo completato» esplicita la fine del contenuto.

## Guida illustrata

[Le tre tavole del primo borgo](docs/GUIDA_VISIVA.md): scelte, interazioni, crescita, sblocchi e progresso offline. Le tavole sono concept esplicativi; per le regole aggiornate prevalgono F02 e il codice corrente.
