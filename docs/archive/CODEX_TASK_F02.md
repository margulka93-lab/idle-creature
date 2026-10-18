# F02 — fluidità, acquisti multipli e traguardi

## Obiettivo
Correggere il feedback umano: il prototipo è macchinoso, richiede acquisti singoli e i livelli non creano accelerazioni riconoscibili. Non aggiungere contenuti per mascherare il problema.
Leggere AGENTS.md, docs/IDLE_RESEARCH.md, docs/FLOW_REVISION.md, docs/FLOW_ACCEPTANCE.md e design/flow.v2.json. La baseline di codice è FIRST_PLAYABLE, commit 8ae73a6; questo branch contiene specifiche F02, non una nuova implementazione già pronta.

## Incarico completo
1. Conserva motore/salvataggi/asset e implementa quote acquisti +1/+10/PROSSIMO/MAX e comandi atomici con test.
2. Introduci milestone automatiche guidate dai dati ai livelli 10/25/50 e anteprime corrette attraverso tutte le soglie. Integra traguardi creature e nuovi prerequisiti progetti secondo FLOW_REVISION.
3. Ridisegna il flusso della schermata Borgo: elenco compatto di tutte le attività, upgrade diretto senza selezione obbligatoria, selettore acquisti condiviso, prossimo traguardo e beneficio visibili. Inspector solo per dettagli. Riduci intestazioni e messaggi ripetitivi.
4. Rendi il ritorno non bloccante, assorbendo il riepilogo in un banner. Cura feedback carezze/acquisti e mantiene input equivalenti.
5. Aggiorna dati runtime, regole documentate, validazione save/import e test senza reset silenziosi. Rendi riconoscibile economyVersion=2 nei nuovi export: niente ricalcolo retroattivo di monete/XP; solo tassi futuri e milestone derivate.
6. Esegui simulazioni comparative dal vecchio codice e dal nuovo con politiche uguali; riferisci progressione, numero di azioni, tempo per obiettivi e traguardi. Se numeri richiedono tuning, agisci entro i limiti di FLOW_REVISION, motivando ogni variazione.
7. Avvia/prova browser desktop/mobile se disponibile, correggi regressioni e consegna report, screenshot e commit/PR. Non limitarti a descrivere o a inserire pulsanti non funzionanti.

## Consegna Git
Continua su design/idle-flow-revision e aggiorna la relativa PR verso codex/first-playable. Non fare merge o deploy. Se lavori su un altro branch, apri PR verso design/idle-flow-revision e indica la dipendenza dalla PR FIRST_PLAYABLE. Non applicare F02 al main vuoto di implementazione e non ricreare il gioco da zero.
Non è necessario interrogare l'utente su scelte tecniche reversibili. Completare tutti i sottopassi dell'incarico corrente.

## Verifica
Soddisfare docs/FLOW_ACCEPTANCE.md e mantenere verdi i controlli pertinenti di FIRST_PLAYABLE. Report in docs/FLOW_IMPLEMENTATION_REPORT.md, dati simulazioni in docs/flow-simulation-results.json e README aggiornato con lo stato effettivo.
La consegna delle specifiche non certifica il divertimento. Il playtest umano successivo decide se il flusso è abbastanza fluido.
