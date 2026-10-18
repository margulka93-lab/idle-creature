# FIRST_PLAYABLE — incarico completo

## Consegna
Costruire da questo repository di sole specifiche un gioco web locale avviabile e giocabile: un quartiere con quattro postazioni, tre creature, tre progetti di espansione e una conclusione visibile. La domanda da verificare è: accarezzare, investire e sbloccare rende una breve visita piacevole mentre il borgo continua a crescere offline?
Non fermarti dopo il primo sottopasso. Il blocco include tutti i punti seguenti. Questa è una singola vertical slice, non l'intero futuro gioco.

## Esecuzione
1. Leggi AGENTS.md e le specifiche. Scrivi un breve piano operativo, poi implementalo nello stesso incarico.
2. Crea React + TypeScript + Vite, versione Node compatibile documentata, lockfile, script dev/build/typecheck/test e controllo E2E. Scegli versioni stabili compatibili nell'ambiente; non richiedere API keys.
3. Implementa il motore, i dati, il salvataggio e un'interfaccia completa. Completa l'intero percorso dai 25 soldi iniziali alla prima festa.
4. Implementa incoraggiamento tramite tap/trascinamento, prodotti speciali, Ora delle meraviglie, crescita, assegnazione e progetti.
5. Costruisci una scena cozy con fondale ed edifici fermi, creature separate e microanimazioni. Riferimento: docs/art/concept-reference.jpg. Se non puoi produrre i raster illustrati definitivi, realizza una fallback originale curata a strati in SVG; mantieni palette/composizione, identifica chiaramente il limite artistico e non bloccarti. Non usare emoji come creature finali della slice. Il riferimento non contiene asset separati utilizzabili direttamente.
6. Verifica nel browser desktop e mobile quando disponibile; correggi overflow, gesture, hitbox e feedback. Nessun pulsante finto. I pannelli Borgo, Creature, Progetti e Collezione devono mostrare dati reali; la collezione in questo scope coincide con tre specie.
7. Esegui controlli automatici e simulazioni. Correggi problemi e completa documentazione e consegna.

## UI e sviluppo
Scena con slot fissi, quattro attività; l'orto è attivo all'inizio e le altre vengono acquistate. Selezione con inspector, pulsante distinto Incoraggia, comando Migliora con costo/beneficio, assegnazione creature. Selezionare non deve comprare o spendere.
Su mobile quartiere in schermata dedicata con altezza limitata, inspector sotto e scroll esterno al riquadro interattivo. Desktop scena e inspector affiancati. Non rimpicciolire tutta l'interfaccia desktop per farla entrare su telefono.
Aggiungi un pannello diagnostico solo in sviluppo (?debug=1) con salta 60s/1h/48h, reset e sblocco di test; usa la medesima funzione del motore. Nessun guadagno o avanzamento debug nel normale gioco di produzione.

## Verifiche obbligatorie
Vedi docs/ACCEPTANCE.md. Usa un clock controllabile. Simula almeno 24 ore con due politiche documentate: passiva con acquisti ai check-in (0/1/4/8/24h) e attiva con gli stessi check-in più incoraggiamento durante finestre di 3 minuti, senza input il resto del tempo. Riporta sblocchi, reddito, produzione e differenze. Se ritocchi numeri per correggere attese o blocchi, aggiorna JSON, motivazione e risultati; non inventare sistemi nuovi.

## Consegna
Branch suggerito codex/first-playable. PR con funzionalità, verifica eseguita, limiti e istruzioni di avvio. Non fare merge/deploy. Se aprire una PR non è disponibile, lascia commit pronti e spiega esattamente cosa manca.
README: setup, comandi, controlli, salvataggio/export/import e stato reale. docs/IMPLEMENTATION_REPORT.md: criteri di accettazione con esito, comandi e risultati, simulazioni, schermate desktop/mobile dove effettivamente catturate, limiti grafici. Non dichiarare l'arte definitiva se usi fallback.
