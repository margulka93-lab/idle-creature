# F03 — ricostruzione intensiva di grafica e UX

Baseline: main commit ea31c4e, FIRST_PLAYABLE+F02 integrati con guida visiva. Feedback utente: meccaniche accettabili, utilizzo ancora insoddisfacente; priorità intensiva a esperienza e grafica. Leggi AGENTS.md e docs/F03_VISUAL_UX.md. Non ripartire da zero e non rifare F02.

## Consegna completa del blocco UX
Ristruttura il layout e le interazioni ordinarie come nella specifica, mantendo motore/economia/salvataggi. Produci schermate reali e una breve registrazione del percorso se gli strumenti la consentono. Prova una partita nuova, sblocco e ritorno offline. Controlla desktop1440x900 e mobile390x844/360x800, focus, contrasto, reduced motion e gesture. Conserva acquisti multipli, preview esatte, backup e regressioni.
Crea prima una composizione coerente della schermata di gioco con gli asset disponibili, poi implementala e correggila nel browser nello stesso incarico. Non limitarti a proposte o CSS cosmetico. Non introdurre nuovi sistemi, contenuti o tuning economico.

## Grafica e risorse
Obiettivo artistico: PRIMO concept docs/art/concept-reference.jpg. Fondo ed edifici fermi, personaggi separati con microanimazioni. Vedi pipeline nel brief. Non dichiarare che un ritocco CSS/SVG abbia consegnato l'illustrazione definitiva. Se hai generazione immagini disponibile, prepara risorse originali separate coerenti con il concept e verifica l'importazione; nessuna API/key a pagamento da introdurre. Se la capacità non c'è, completa interamente il lavoro UX e l'integrazione via manifest, documenta esattamente asset mancanti e misure/pivot/hitbox richiesti, senza sostituire la direzione approvata con un altro fallback artistico dichiarato finale.
Le immagini illustrative non possono contenere UI, testi o creature incorporate nel fondale. Grafica non deve peggiorare contrasto, leggibilità o hitbox.

## Consegna e autonomia
Lavora su design/f03-visual-ux e aggiorna la sua PR verso main; nessun merge/deploy. Completa implementazione, verifiche e correzioni senza conferme intermedie su scelte reversibili. Mantieni docs/FLOW_IMPLEMENTATION_REPORT.md come storico; nuovo report docs/F03_IMPLEMENTATION_REPORT.md con cosa è implementato, cosa è solo illustrato, limiti e comandi realmente eseguiti. Aggiorna README allo stato vero, non ai soli intenti.
