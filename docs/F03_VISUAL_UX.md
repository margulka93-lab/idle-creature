# F03 — direzione visiva ed esperienza

## Stato, prove e confini
19 ottobre 2026. Meccaniche F02 considerate dall'utente una base utilizzabile; esperienza ancora da migliorare intensivamente. Non è approvazione del bilanciamento finale. FIRST_PLAYABLE, F02 e guida visiva sono ora su main.
Analisi svolta sulle due immagini reali F02 desktop-traguardo/mobile390-traguardo e report di implementazione, non su una prova interattiva eseguita qui. Su mobile la cattura completa è una lunga pagina: header+nav+titolazione, scena, abilità, toolbar, schede verbose, progetto, footer. Ogni singola attività ripete livello, reddito, costo, prima/dopo, soglia e feedback in blocchi separati. Su desktop scene e controlli competono; dettagli e testo hanno molto peso rispetto alle creature. Questo è il punto da correggere.
Questo documento definisce una direzione proposta concreta per il prossimo incarico, non certifica ancora fluidità o arte definitiva.

## Esperienza richiesta
Entrare → vedere subito il borgo e cosa è disponibile → compiere un gesto o miglioramento → percepirne l'effetto nella stessa zona. Nessuno scroll attraverso migliaia di pixel per le azioni più frequenti.
Preservare +1/+10/PROSSIMO/MAX, confronto delle quattro attività e acquisti diretti senza inspector obbligatorio. Ridurre informazioni duplicate invece di nascondere tutti gli upgrade dietro una selezione.

## Layout
Header compatto: monete, cristalli e livello borgo; produzione/s leggibile. Titolo del gioco discreto. Niente pagina-intro separata, slogan o testi di sviluppo nel flusso normale. Non mostrare info tecniche sui salvataggi eccetto errore reale o impostazioni.
Desktop: scena protagonista ~65% larghezza, pannello azioni ~35% con quattro righe compatte, selettore acquisti condiviso e prossimo progetto. Evitare schede di una singola attività alte centinaia di pixel. Inspector dettagli solo se richiesto, pannello laterale o popover con chiusura chiara.
Mobile: layout progettato per dito e viewport, non desktop impilato. Header, scena con creature grandi, dock compatto per gestione e nav inferiore. Gestione espandibile come pannello/drawer accessibile; almeno acquisto dell'attività selezionata e azione più utile devono restare raggiungibili senza scroll lungo. Offrire anche vista compatta delle quattro attività con upgrade diretti per confronto/spesa. Non imporre tap scena→dettagli→upgrade a ogni acquisto. Non nascondere tutti i comandi sotto la scena.
Prototipare una variante con scena sopra e quattro righe compatte sotto nel normale viewport390x844; se spazio insufficiente adottare drawer espandibile, documentando il numero di azioni. Evitare di comprimere testo sotto14px per far entrare tutto. A360px/zoom200% garantire scroll accessibile nel pannello, senza tagli o controlli fuori schermo. Altezza dinamica viewport/safe areas gestite, nessuna dipendenza da coordinate assolute desktop.
Navigazione: Borgo principale, dettagli Creature/Collezione e Progetti secondari. Progetto prossimo in riga compatta espandibile. Impostazioni separata. Non servono nuove pagine introduttive.

## Riga attività e gerarchia
Nome+icona+L; un rate dominante; prossimo target e pulsante con costo. Prima/dopo consultabile in preview/tooltip o testo secondario, senza ripetere quattro volte la soglia. Costruisci/upgrade restano comandi distinti. Prezzo e motivo di disabilitazione leggibili anche senza hover. Stato 'bloccato' non sembra un grosso pulsante acquistabile. Un solo feedback locale per acquisto.
Se PROSSIMO è troppo caro ma +1 è disponibile, segnalarlo con azione rapida esplicita 'Puoi comprare +1'; non cambiare silenziosamente modalità né lasciare credere che non si possa fare nulla.
Attività possedute e future separate visivamente; non aumentare automaticamente il pannello a ogni tick. Stabilità DOM/focus e layout. Nessuna ricostruzione totale della UI a ogni pointermove.

## Creature e tatto
Creature devono essere riconoscibili anche sul telefono: spazio visivo, silhouette e contrasto. Non minuscole decorazioni. Hitbox con margine adeguato, coerente con il personaggio e verificata nel browser. I prodotti speciali non devono sovrapporsi alle carezze.
Swipe: reazione immediata della creatura attraversata, stato +50% locale e scadenza, senza toast centrale ripetuto. Tap seleziona, drag incoraggia; pulsante e tastiera sempre equivalenti. Evitare acquisti accidentali al rilascio del drag. Pannello mobile e scena gestiscono correttamente il confine scroll/gesto.
Animazione: respiro, blink se possibile, piccolo gesto lavoro e reazione; nessuna corsa nello scenario. Acqua, alberi ed edifici fermi. Effetti brevi e sobri, niente particelle continue. Riduzione movimento non elimina informazione.
Il feedback deve mostrare causa/effetto: creatura reagisce, indicatore bonus si attiva, tasso cambia. Non affidarsi a una grande quantità di testo per spiegarlo.

## Grafica illustrata
Riferimento approvato: primo concept, palette verde/crema/lilla/turchese, edifici accoglienti e dettagli magici. Il secondo mockup estremamente semplificato non è lo stile da perseguire.
Asset necessari: un fondale clean senza UI/creature, quattro edifici a strati, tre creature trasparenti con almeno idle/reazione, icone UI coerenti. Evitare ritagli grossolani del concept intero. Riutilizzare i master locali solo se visivamente adatti; le identità provvisorie non sono automaticamente master approvati di altri progetti.
Manifest definisce src, dimensioni, pivot, scala, margine hitbox e ancoraggio normalizzato. Edifici e personaggi separati dal fondale; sblocchi cambiano stato/strato statico. Testi/pulsanti reali in HTML. Artboard coordinate coerenti con scaling e copertura: niente deformazione per riempire mobile.
Se mancano asset illustrati, UX può progredire ma arte resta incompleta. Consegnare elenco preciso delle risorse necessarie, non un altro screenshot carino non implementabile o un fallback proclamato definitivo.

## Percorsi da dimostrare
1. Nuova partita: capire produzione e primo acquisto senza leggere tutorial lungo.
2. Comprare +1 o arrivare a soglia con PROSSIMO dalla schermata principale, costo/beneficio leggibili.
3. Accarezzare due creature con un gesto e raccogliere un prodotto senza selezioni accidentali.
4. Consultare il prossimo progetto e tornare alla scena senza perdere selezione o posizione.
5. Ritorno dopo assenza: riepilogo discreto, acquisto immediato, nessuna finestra obbligatoria.
6. Sessione mobile breve: annotare tap/scroll per incoraggiare, migliorare, cambiare quantità e trovare sblocco. Confrontare con F02 senza inventare tempi osservati.

## Accettazione
- Il Borgo non appare più come una lunga pagina di schede e spiegazioni: comandi principali prossimi alla scena; numero di scroll/tap riportato per ciascun percorso, non solo 'responsive'.
- Icone, rate, costo, soglia e stato disabilitato leggibili a390/360; pulsanti>=44px; nessuna sovrapposizione con safe areas o tastiera.
- Economia/migrazioni restano F02: nessun cambio numerico, niente premi/reset aggiunti, regressioni salvataggio e offline verdi.
- Snapshot desktop/mobile reali a inizio, due creature, soglia, progetto e ritorno; immagini generate come mockup separate dagli screenshot reali.
- Una registrazione breve del percorso se disponibile, altrimenti indicare limite. Nessun successo dedotto soltanto dai test.
- Asset finali/fallback dichiarati con esattezza. Aggiustamenti visivi provati in browser, non solo file CSS scritti.
- Nessun nuovo sistema, monetizzazione, backend, account o 3D. PR verso main, niente merge/deploy.

## Dopo F03
Playtest umano su flusso nuovo, quindi rifinitura artistica e solo in seguito durata/contenuti. 'Intensivo' significa completare e verificare l'esperienza, non introdurre nuove funzionalità per numero.
