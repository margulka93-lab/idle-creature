# Direzione artistica

## Riferimento
concept-reference.jpg è il PRIMO concept generato in conversazione, preferito dall'utente. Si mantiene il suo carattere illustrato cozy moderno-magico; non il successivo mockup estremamente semplificato. Il riferimento contiene quattro attività, tre terrazze, creature grandi e UI crema/verde. Non è screenshot del gioco già sviluppato, non è un atlas e non definisce le identità approvate di vecchi progetti. Numeri e testi nell'immagine sono esempi: dati e regole correnti prevalgono.

## Composizione
Desktop: scena circa 70%, inspector 30%, header risorse e navigazione chiara. Mobile: scena adattata senza testi minuscoli; inspector come pannello sotto, navigazione raggiungibile e viewport 360px senza overflow orizzontale. Stato e tassi reali, niente UI disegnata nel fondale.
Fondale: paesaggio morbido, radura, vegetazione, acqua, dettagli magici. Edifici separati ma statici, varianti discrete ai livelli 10/25/50 facoltative per questa slice. Fondale non deve contenere creature duplicate, etichette o pulsanti. Slot fissi, niente camera libera o pathfinding.
Creature autonome sopra la scena: Momo crema/foglie, Nibi lilla/orecchie, Tula turchese/guscio. Le nuove forme sono provvisorie e non pretendono di riutilizzare i master di Creature-Sanctuary.

## Animazione minima
Solo creature: respiro lieve, blink se tecnicamente separabile, gesto lavoro e piccola reazione al tocco. Massimo qualche pixel di traslazione/2-3 gradi di rotazione. Fondali, acqua, mulino e vegetazione fermi. Microfeedback UI temporanei ammessi; niente particelle permanenti, effetti costosi o animazione integrale della scena. prefers-reduced-motion disattiva le animazioni lasciando invariati segnali testuali e bonus.

## Pipeline
Produzione definitiva: clean plate statico, postazioni PNG/WebP trasparenti e creature PNG/WebP trasparenti o sprite a parti separate, manifest con dimensione, pivot, scala e hitbox. Raster generati richiedono capacità immagini: nessuna API a pagamento obbligatoria per l'app.
Per FIRST_PLAYABLE Codex non deve attendere asset o chiavi: può realizzare fallback originali a strati SVG/CSS curati con la stessa composizione, palette e silhouette. Fallback è una limitazione da dichiarare, non il nuovo stile approvato. Niente screenshot intero come unico fondale interattivo, ritagli grossolani dal concept con UI incorporata, emoji o asset remoti fragili. Tutte le risorse usate devono essere nel repository e riproducibili. Tenere percorsi e manifest pronti alla sostituzione senza modificare la logica.
