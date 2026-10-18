# Istruzioni per Codex

## Obiettivo e autorità
Realizzare Borgo delle Creature, idle web 2D con creature, crescita, produzione automatica e interazione tattile. Questo repository è un nuovo progetto: non importare codice o canone da Creature-Sanctuary o altri repository senza richiesta.
Ordine di lettura: questo file; CODEX_TASK.md; docs/IDLE_RESEARCH.md; docs/FLOW_REVISION.md; docs/FLOW_ACCEPTANCE.md; design/flow.v2.json; docs/GAME_DESIGN.md; docs/SYSTEMS.md; design/balance.v1.json; docs/ART_DIRECTION.md; docs/TECH_SPEC.md; docs/ACCEPTANCE.md.
Le istruzioni dell'utente prevalgono. Le regole F02 prevalgono su documenti v1 in conflitto; i documenti v1 restano baseline storica. Le regole sono la baseline del prototipo; i numeri sono ipotesi verificabili, non economia già validata.

## Autonomia autorizzata
Completare l'intero incarico corrente senza chiedere conferma a ogni passaggio. Installare dipendenze necessarie, creare applicazione, asset provvisori originali, test, documentazione, correggere errori e verificare nel browser quando disponibile. Risolvere autonomamente scelte tecniche reversibili e annotare assunzioni. Non fermarsi a piano, TODO o scaffold. Se una capacità è bloccata, completare le parti indipendenti e descrivere il blocco reale.
Lavorare su un branch dedicato e consegnare una PR, senza merge o deploy. Se non è possibile aprirla, consegnare commit e istruzioni precise. Non attivare servizi a pagamento, account, backend o API runtime.

## Confini
Scope corrente: F02 descritto in CODEX_TASK.md. FIRST_PLAYABLE è la baseline implementata e resta storica in docs/archive/CODEX_TASK_FIRST_PLAYABLE.md. Le fasi in docs/ROADMAP.md sono future, non autorizzazioni ad aggiungere funzionalità. Non aggiungere combattimento, riproduzione, gacha, monetizzazione, fame, malattia, multiplayer, prestigio o pathfinding.
Nessun obiettivo di tempo artificiale: completare il lavoro utile con controlli proporzionati. Non ripetere test già verdi senza cambiamenti rilevanti. Non dichiarare verifiche o schermate mai eseguite.

## Qualità
Logica indipendente da React; tempo iniettabile; stato serializzabile; contenuti guidati dai dati. Interfaccia interamente italiana. Monete frazionarie nel motore, arrotondamento solo in visualizzazione. Economia mai dipendente dagli FPS.
Touch, mouse e tastiera devono consentire azioni equivalenti. Niente hover necessario su mobile. Scorrere la pagina non deve incoraggiare accidentalmente creature.
Grafica: riferimento illustrato statico + creature separate; niente 3D. Non spacciare uno screenshot immobile per gioco interattivo.
Verificare produzione, bonus, offline, assegnazioni, acquisti atomici e salvataggi. Aggiornare README con comandi reali e docs/IMPLEMENTATION_REPORT.md con risultati e limiti.
