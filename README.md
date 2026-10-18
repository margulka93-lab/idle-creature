# Borgo delle Creature

FIRST_PLAYABLE completo di un idle web 2D italiano: un quartiere, quattro attività, tre creature, tre progetti e la prima festa del borgo. Produzione automatica, crescita, carezze, prodotti speciali, Ora delle meraviglie e progresso offline fino a 48 ore. Nessun account, backend o API runtime.

La grafica è un **fallback SVG originale e provvisorio**, a strati. Il riferimento illustrato in `docs/art/concept-reference.jpg` resta la direzione per i raster definitivi: il fallback non li sostituisce come stile approvato.

## Avvio locale

Node **22.12+ della serie 22, 24.x oppure 26+** e npm. Ambiente verificato: Windows, PowerShell, Node 26.7.0, npm 11.19.0. `.nvmrc` indica la versione esatta usata. Il lockfile è incluso.

```powershell
git clone https://github.com/margulka93-lab/idle-creature.git
cd idle-creature
# Se la PR non è ancora integrata:
git switch codex/first-playable
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
- Un tap/click su postazione o creatura **seleziona**. Nell’inspector vedi tasso, costo e beneficio di un miglioramento. Acquistare e migliorare sono comandi distinti.
- **Incoraggia** dà +50% per 30 secondi alla creatura assegnata. Puoi anche premere e trascinare intenzionalmente sulle creature. Il gesto inizia dopo 8 pixel; il semplice passaggio del mouse non attiva nulla.
- Su telefono trascina nella scena; scorri la pagina **fuori dalla scena** per raggiungere inspector e comandi. La scena ha altezza contenuta, senza camera libera.
- Tastiera: Tab/Shift+Tab per spostare il focus; Invio/Spazio sui pulsanti; frecce nei menu di assegnazione. Nessun gesto è obbligatorio: usa Incoraggia e Raccogli prodotto. Il riepilogo di ritorno si chiude anche con Esc.
- Ogni attività matura un prodotto in 3 minuti, massimo uno pronto, senza scadenza. Raccoglilo nella scena o nell’inspector.
- Le creature crescono automaticamente lavorando. In **Creature** puoi cambiare attività gratuitamente o metterle a riposo; una sola creatura per postazione.
- Acquista Vivaio → Nibi; realizza Sentiero → Mulino e Meraviglie; acquista Mulino → Tula; realizza Ponte → Laboratorio e giardino; realizza Festa → conclusione visibile. Condizioni e risorse sono mostrate nell’inspector e in **Progetti**.
- I cristalli arrivano dai traguardi della produzione totale; spendere monete non azzera quei progressi. **Collezione** mostra le tre specie effettive.

## Salvataggi e più schede

Il gioco salva in `localStorage`, chiave `borgo-creature.save.v1`, ogni 5 secondi, dopo le azioni e al passaggio in background/uscita. Al ritorno riconcilia una sola volta tempo, bonus, XP, cristalli e prodotti; sopra 48 ore scarta il tempo eccedente. Un riepilogo appare dopo almeno 60 secondi e non accredita nuovamente le risorse alla chiusura.

Apri **Impostazioni** in alto per esportare JSON, importare un file o incollare JSON. Import e reset richiedono conferma prima di sostituire la partita. L’export include versione dello schema e `lastSimulatedAt` in millisecondi UTC. Conserva una copia fuori dal browser prima di cancellare i suoi dati.

Un salvataggio corrotto o di versione sconosciuta blocca l’avanzamento e resta conservato, con export dei dati originali e reset esplicito. Se possibile è copiato anche in `borgo-creature.save.v1.recovery`. Se lo storage è negato, si gioca in memoria con avviso persistente: esporta prima di uscire.

Una Web Lock rende una sola scheda proprietaria della partita. Le altre mostrano dati salvati e restano in sola lettura: non avanzano né scrivono. Dopo aver chiuso la proprietaria, usa **Riprova dopo aver chiuso l’altra scheda**. Non si sottrae una lock a una scheda ancora aperta. Browser privi di Web Locks restano in sola lettura con messaggio; usare un browser aggiornato.

## Verifiche riproducibili

```powershell
npx playwright install chromium
npm run test:e2e
```

Il comando costruisce anche la versione di produzione e avvia temporaneamente dev (5173) e preview (4173). Esegue Chromium a 1440×900, mobile emulato 390×844 e 360×800, con input touch tramite protocollo Chromium. Non richiede server avviati a mano. Per isolare un profilo: `npm run test:e2e -- --project=mobile390`.

Evidenze: **24 unit test**, **35 E2E superati + 1 test touch non applicabile al desktop**, simulazioni deterministiche di 24 ore e percorso passivo essenziale. Dettagli, criteri 1–15, risultati e limiti in [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md); dati numerici in [docs/simulation-results.json](docs/simulation-results.json).

Screenshot reali catturati dai test browser, a pagina intera:

- [Desktop: inizio](docs/screenshots/desktop-inizio.png) · [borgo completato](docs/screenshots/desktop-borgo.png)
- [Mobile 390: inizio](docs/screenshots/mobile390-inizio.png) · [borgo completato](docs/screenshots/mobile390-borgo.png)
- [Mobile 360: inizio](docs/screenshots/mobile360-inizio.png) · [borgo completato](docs/screenshots/mobile360-borgo.png)

Non sono prove su telefoni fisici o Safari/Firefox, né un playtest umano di divertimento. Gli E2E controllano il tempo con il clock browser: non attendono ore reali.

## Diagnostica e struttura

Solo con `npm run dev`, apri `/?debug=1`: salti di 60s/1h/48h, reset con conferma e sblocchi di test. Tutti usano `advance` e i comandi ordinari. Gli sblocchi avanzano 24 ore e acquistano tramite motore: non aggiungono una valuta alternativa. Il clock di prova resta spostato fino al reset; usa una partita separata o riparti da zero dopo i test. Il pannello e le sue azioni non esistono nella build di produzione, anche con `?debug=1`.

- `src/core`: motore serializzabile, clock esplicito, nessuna dipendenza React/DOM.
- `src/content`: dati da `design/balance.v1.json`, riferimenti artistici nel manifest.
- `src/persistence`: validazione, recupero e adapter storage.
- `src/ui`: controller unico, lock, clock, pannelli e CSS responsive.
- `src/scene`: renderer a strati e intersezione segmenti/hitbox.
- `public/assets`: fondale, edifici e creature SVG locali; sostituibili tramite `src/content/art-manifest.json`.
- `tests`: motore/persistenza/geometria ed E2E; `scripts/simulate.ts`: politiche di visita ripetibili.

Economia baseline invariata; niente combattimento, fame, gacha, monetizzazione, prestigio, riproduzione, multiplayer o sistemi della roadmap futura. Dopo la Festa il borgo produce ancora, ma questo contenuto finito non promette progressione infinita.
