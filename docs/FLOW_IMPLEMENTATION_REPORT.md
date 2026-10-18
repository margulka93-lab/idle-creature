# F02 — implementazione, migrazione ed evidenze

18 ottobre 2026. Branch `design/idle-flow-revision`, PR #3 verso `codex/first-playable`; nessun merge o deploy. Baseline già presente: FIRST_PLAYABLE, commit `8ae73a6`. Il progetto e gli asset esistenti sono stati conservati.

## Cambiamenti effettivi

- Un solo `quoteUpgrade` calcola target, quantità, costo intero esatto, affordability, rate passivi prima/dopo e soglie attraversate. Comandi atomici `+1/+10/PROSSIMO/MAX`, senza dispatch multipli dalla UI. Il comando riconcilia il clock e riquota; un acquisto riuscito produce un save e un feedback aggregato locale.
- Configurazione runtime: numeri base invariati di `balance.v1.json` + `flow.v2.json` attiva. Milestone derivate L10/L25/L50 ×2/×4/×8, talento preferita L5 +0,10, carezze future L10=45s e L20=60s. Nessun accumulatore di moltiplicatori o premio aggiuntivo. I prezzi, le risorse dei progetti e le soglie cristalli non sono stati ritoccati.
- Checklist dei progetti nel motore e nella UI: Sentiero Orto10; Ponte Orto/Vivaio/Mulino10; Festa tutte attività25 e creature5, oltre ai prerequisiti e costi precedenti. Progetti storici completati conservati anche sotto i nuovi gate.
- Borgo con scena e lista operativa stabile: ogni attività ha upgrade diretto, icona, occupazione, tasso passivo, target e costo, prossimo traguardo con barra livelli, soglie raggiunte, carezza e raccolta. Il selettore condiviso è sticky e ricorda una preferenza UI separata. Inspector facoltativo, aperto solo da selezione/Dettagli; nessuna selezione richiesta per spendere. Stesso ordine delle righe a ogni tick; niente autofocus dal tick.
- Ritorno in banner espandibile, nessun dialogo da chiudere prima di comprare. I guadagni sono già accreditati. Le carezze mostrano timer locale e reazione della creatura, senza toast globali per rinnovi/throttle; reduced motion mantiene il testo. Reset e import conservano conferme esplicite.

## Migrazione e protezione dati

Schema strutturale resta `schemaVersion:1`; i nuovi stati/export dichiarano `economyVersion:2`. `parseSave` accetta legacy senza economyVersion o con 1, valida esplicitamente la 2 e rifiuta versioni future. La chiave economica resta `borgo-creature.save.v1` per ritrovare le partite esistenti. La modalità acquisti usa separatamente `borgo-creature.purchase-mode.v1`.

`legacy-v1.ts` conserva il motore del commit 8ae73a6 con import indirizzato a `content/legacy.ts`, che legge soltanto i dati v1. Al caricamento/import legacy, l’intervallo fino all’istante della migrazione viene eseguito da quel motore, incluso cap48h, XP, bonus residui e traguardi cristalli originali. Solo dopo si imposta economyVersion2. Il nuovo rate dipende dai livelli già posseduti e si applica al futuro; nessuna ricostruzione dei guadagni passati. Anche scadenze di carezze già attive restano quelle originali.

La prima copia raw pre-F02 viene salvata in `borgo-creature.pre-f02.v1` prima di sovrascrivere la partita, ed è esportabile dalle Impostazioni anche dopo reload. Ulteriori import legacy non cancellano quella prima copia; l’utente conserva inoltre il file/testo che sta importando. Se il backup non è scrivibile, non si sovrascrive la partita v1: il gioco continua in memoria e offre il raw da esportare con avviso persistente. Corrotti e versioni sconosciute mantengono il recupero esistente. Import ripetuti sostituiscono la partita dopo conferma: non aggiungono il ricalcolo al saldo corrente. Test dedicati verificano due import dello stesso file al medesimo istante e reload senza doppio accredito.

Web Locks e clock unico restano attivi. Una seconda scheda non migra il tempo né scrive il salvataggio/backup; il takeover richiede chiusura della proprietaria e comando esplicito. Tempo inverso, idempotenza e cap48h sono coperti dalle regressioni. Nessuna migrazione distruttiva o reset silenzioso.

## Comandi e verifiche realmente eseguiti

Windows/PowerShell; Node26.7.0, npm11.19.0; Chromium156.0.8078.4 via Playwright1.64.1. Nessuna nuova dipendenza runtime.

| Controllo | Esito |
| --- | --- |
| `npm run typecheck` | Superato |
| `npm test` | **38 superati**, 2 file; 24 regressioni adattate alle modifiche intenzionali + 14 casi F02 |
| `npm run build` | Superato; TypeScript + Vite7.3.7; JS circa270kB, 84kB gzip, CSS24kB |
| `npm run test:e2e` | **50 superati, 1 saltato**: il caso touch è escluso solo dal profilo desktop; 17 casi ×3 profili |
| `npm run simulate` | Otto esecuzioni comparative fino a24h con motore v1 originale e v2, nessun NaN, saldo negativo o percorso bloccato |
| `npm audit` | Nessuna vulnerabilità nelle dipendenze |
| `git diff --check` | Nessun errore whitespace |

E2E desktop1440×900, mobile emulato390×844 e360×800; input touch via CDP. React StrictMode resta attivo. Gli orologi sono controllati: non sono trascorse24/48 ore reali, e non è un test su telefono fisico. Le nuove asserzioni di import/costo esatto congelano il clock al timestamp della fixture per distinguere la spesa dalla produzione che nel browser continua regolarmente.

## Accettazione F02

| Requisito | Evidenza ed esito |
| --- | --- |
| Default PROSSIMO, quattro modalità e preferenza stabile | Browser verifica default, cambio +10/MAX e reload. Salvataggio UI separato, fallback al default se storage non disponibile. Superato. |
| Quote/costo esatto e casi limite | Unit indipendente L8→10:153 e rate3,835→9,49. Somma dei ceil singoli, fondi esatti/insufficienti/zero, blocco+10 non degradato, cap50 e blocco47→50. Superato. |
| MAX massimale e atomicità | Dopo MAX nessun +1 sostenibile; bulk da1 a50 equivale a49 comandi singoli allo stesso istante. XP invariati, nessun tempo gratuito, seconda spesa rifiutata al cap. Browser un click attraversa10/25/50 con unico feedback. Superato. |
| Anteprima stabile | Quote usa produzione passiva, inclusi assegnazione/talenti/soglie, indipendente da carezza/Meraviglie. Rate attivo mostrato separatamente. Superato. |
| Soglie attività e creature | Bordi9/10,24/25,49/50, fattori1/2/2/4/4/8; L5 preferita, durate30/45/60, scadenza esistente conservata. Online/offline attraversa i talenti con gli stessi risultati; nessuna riapplicazione al reload. Superato. |
| Progetti nuovi e storici | Checklist e comandi applicano nuovi livelli; percorso completo UI da zero con gate disabilitati prima degli upgrade. Legacy con Festa a livelli bassi migra senza annullarla. Cristalli28 contro23 richiesti. Superato. |
| Upgrade da lista in un click | Nessun inspector aperto nel test diretto; identità/ordine DOM delle righe e focus mantenuti dopo tick. Misure di click sotto. Superato. |
| Mobile, pulsanti e toolbar | Nessun overflow360/390; controlli lista almeno44×44; toolbar sticky verificata durante scroll; scena e scroll esterno mantengono separazione touch. Superato in emulazione. |
| Nessun popup obbligatorio | Test compra con banner di ritorno ancora aperto e zero dialoghi DOM. Traguardi locali/derivati consultabili, carezze senza toast anche in reduced motion. Conferme di import/reset mantenute. Superato. |
| Migrazione/backup/export | Confronto contro avanzamento v1 indipendente fino alla migrazione, v2 solo dopo; export2, rifiuto futuro, doppio import, reload, backup esportabile e quota negata senza sovrascrivere v1. Superato. |
| Regressioni tecniche | Offline0/60s/1h/48h/72h, clock inverso/non finito, partizionamento, assegnazioni, prodotti, cooldown, import/export/reset, storage negato, due tab, takeover e debug escluso dalla produzione. Superato. |
| Evidenze e limiti | JSON comparativo, report, README e12 screenshot reali F02. Fluidità/divertimento richiedono nuovo playtest umano. |

## Confronto numerico v1/v2

File riproducibile: `docs/flow-simulation-results.json`, script `scripts/flow-simulate.ts`. Il confronto usa realmente il motore originale, non una ricostruzione semplificata della v1. Registrati eventi di acquisto, soglie attività e talenti con tempi, checkpoint5/15/30min/1h/24h, tassi passivi, numero di comandi e attesa del prossimo obiettivo. Durante le assenze si salta direttamente al prossimo evento/visita; nessun acquisto nascosto.

Politiche identiche per versione e variante bonus:

- Visite a0 e ogni minuto fino a30min, poi1h/4h/8h/24h. Primo upgrade +1 a0; costruzioni e progetti vengono tentati prima degli investimenti e dopo ogni acquisto riuscito.
- **Marginale**: investe in +1 per miglior rendimento marginale/costo. È un confronto che volontariamente non sfrutta i bulk per ridurre i comandi.
- **Obiettivi**: risparmia per soglie10/25, poi MAX verso50. In v1 lo stesso blocco viene eseguito con i singoli comandi originali; v2 usa un solo comando. Se i fondi mancano si attende, senza degradare PROSSIMO a+1. I requisiti diversi determinano naturalmente scelte/tempi diversi, a parità di politica e istanti di visita.
- **Attiva**: aggiunge carezze/raccolte/Meraviglie ogni15s durante finestre di3min a0/5/15/30/60/240/480min. Nessun input extra fuori finestra e nessun acquisto extra rispetto alla cadenza comune. La passiva non usa questi input. Conta separatamente256–260 azioni bonus nelle esecuzioni attive.

| Politica | Versione | Primo L10 | Nibi | Festa passiva/attiva | Tutto L50 | Upgrade UI passiva/attiva |
| --- | --- | --- | --- | --- | --- | --- |
| Marginale | v1 | 6/5min | 3/2min | 16/13min | 24h | 196/196 |
| Marginale | v2 | 5/4min | 3/2min | 27/23min | 4h | 196/196 |
| Obiettivi | v1 | 8/8min | 3/2min | 20/17min | 24h | 196/196 |
| Obiettivi | v2 | 6/5min | 3/2min | 23/19min | 4h | 22/24 |

La tabella riporta passiva/attiva dove una cella contiene due tempi. Tempo dei cap è osservato ai check-in, non una stima del primo istante teorico in cui sarebbe stato possibile spendere.

Produzione cumulativa, politica obiettivi:

| Checkpoint | v1 passiva | v1 attiva | v2 passiva | v2 attiva | Vantaggio attivo v2 cumulativo |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5min | 464,220 | 698,893 | 464,220 | 786,613 | +69,45% |
| 15min | 5.165,090 | 7.547,112 | 24.788,160 | 48.893,583 | +97,25% |
| 30min | 26.545,560 | 33.451,295 | 371.621,920 | 534.155,663 | +43,74% |
| Ritorno1h | 81.343,240 | 93.573,510 | 1.592.828,640 | 1.903.774,163 | +19,52% |
| 24h | 10.382.875,000 | 10.431.089,510 | 167.622.136,320 | 168.650.325,083 | +0,61% |

Il vantaggio attivo v2 **nell’intervallo**, non soltanto cumulativo, è +69,45% a0–5min, +97,78% a5–15min, +39,91% a15–30min, +12,15% a30–60min. Con la politica marginale è rispettivamente +92,23%, +73,83%, +32,16%, +11,04%. Il basso differenziale a24h è dovuto alla saturazione: entrambi i v2 sono al cap e producono2138,728/s passivi. Non va usato da solo per giudicare le carezze.

Il JSON include per ogni checkpoint il prossimo obiettivo, quando viene realizzato da quella politica e l’attesa risultante. Esempio obiettivi/passiva v2: a5min Sentiero tra2min; a15min Festa tra8min; al ritorno1h la prossima soglia ancora mancante è Mulino50 alla visita4h, quindi180min per scelta di calendario. Non è un timer del gioco né un blocco di produzione.

## Azioni, ritmo e tuning

Scenari controllati a saldo sufficiente, senza produrre denaro da un click di upgrade:

| Scenario | Upgrade v1 | Upgrade F02 | Note |
| --- | ---: | ---: | --- |
| Orto1→10, fondi esatti | 9 | 1 PROSSIMO | Nessuna selezione preventiva nella lista |
| Orto8→10,153 monete | 2 | 1 PROSSIMO | Verificato in unit e browser |
| Quattro attività1→50, saldo sufficiente | 196 | 4 MAX | Un comando per attività, non196 dispatch UI |

Nelle simulazioni obiettivi, upgrade196→22 passivi (−88,8%) e196→24 attivi (−87,8%). Includendo costruzioni/progetti e selezioni necessarie dell’inspector v1, il modello conta211→28 azioni economiche passive e211→30 attive. Le selezioni sono modellate quando si cambia attività tra acquisti, assumendo Orto già selezionato all’inizio; non comprendono movimenti/scroll, navigazione opzionale o chiusura del vecchio dialogo di ritorno. Non sono un cronometro osservativo di una persona. I casi di lista e un click sono eseguiti realmente negli E2E. Con pochi fondi il bulk non crea acquisti gratuiti: +1 resta disponibile dall’inizio e la UI lo segnala se PROSSIMO è ancora troppo caro.

Target iniziali: primo upgrade immediato disponibile passando a+1; L10 v2 entro3–8min in entrambe le politiche; Nibi prima di10min; la Festa non anticipa la v1 per i soli moltiplicatori, grazie ai nuovi gate. **Nessun numero cambiato**: costo base/crescita1,16/prezzi/progetti/cristalli rimangono originali. Non è stata necessaria una variazione entro i limiti1,12–1,22.

Limite rilevato: la politica obiettivi/passiva ha un intervallo massimo di4min senza acquisti nei primi30min (3min attiva); la marginale investe ogni minuto. Il target “una decisione sensata per minuto” non è dimostrato universalmente: risparmiare per una soglia comporta attese. Dopo la Festa il cap arriva alla visita4h, prima della baseline24h. La revisione migliora gli investimenti e rende la conclusione coerente, ma non crea giorni di contenuto; servono playtest per valutare attesa, gratificazione e forza dei bonus. Nessun timer artificiale o nuovo sistema è stato introdotto per mascherare queste osservazioni.

## Schermate e limiti residui

In `docs/screenshots/f02/`, per ciascuno dei profili desktop/mobile390/mobile360:

- `*-inizio.png`: partita iniziale dopo circa2min di clock controllato, una carezza e primo upgrade+1.
- `*-borgo.png`: partita v1 completata e migrata come fixture, poi raccolta, Meraviglie, assegnazioni e pannelli. Rende visibile il mantenimento del completamento storico, non prova i nuovi gate.
- `*-traguardo.png`: fixture Orto8 con153 monete, acquistato PROSSIMO; riga10, feedback e nuova soglia25.
- `*-ritorno.png`: save legacy offline riconciliato, banner non bloccante e lista operativa prima di investire.

Il percorso completo F02 da zero senza fixture/debug è verificato separatamente sui tre profili. Screenshot realmente catturati dal browser, non mockup; quelli storici v1 nella cartella superiore restano conservati.

Mobile è emulazione Chromium con touch via CDP, non hardware Android/iOS. Safari/Firefox, screen reader e sospensione fisica del dispositivo per48h non verificati. Arte SVG provvisoria invariata, raster illustrati definitivi fuori da F02. Persistenza locale per origine, senza sincronizzazione tra dispositivi; Web Locks richiede browser aggiornato e contesto sicuro/localhost. Il gate finale di **fluidità e divertimento resta un nuovo playtest umano**.
