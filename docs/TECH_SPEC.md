> Baseline FIRST_PLAYABLE (storica). Per F02, CODEX_TASK.md e docs/FLOW_REVISION.md prevalgono su acquisti, milestone, prerequisiti, UI, ritorno e migrazione. Accettazione corrente: docs/FLOW_ACCEPTANCE.md; conservare le regressioni tecniche applicabili qui sotto.

# Architettura della prima slice

Stack baseline: TypeScript + React + Vite, CSS, SVG/PNG/WebP a strati. Nessun engine 3D, backend, account, API runtime o servizio a pagamento. Scegliere versioni stabili compatibili e committare lockfile. Test unitari con Vitest, E2E con Playwright se installabile. Script typecheck/build/test obbligatori; E2E separato con istruzioni.

## Moduli
src/core: stato, comandi, produzione/advance e invarianti, nessuna dipendenza React/DOM. src/content: carica/valida design/balance.v1.json o suo formato TS derivato senza duplicare valori divergenti. src/persistence: adapter localStorage, schema e validazione. src/ui e src/scene: pannelli, gesture e rendering. public/assets: risorse locali. scripts: simulazioni ripetibili. Percorsi equivalenti consentiti se documentati.

## Stato minimo
schemaVersion, coins, lifetimeCoins, crystals; activities{stableId:level}; creatures{stableId:unlocked,level,xpInLevel,assignedActivityId,encouragedUntil,lastEncouragedAt}; completedProjects; claimedMilestoneIds; specialProducts per attività con secondsAccumulated/ready; festivalEndsAt/readyAt; lastSimulatedAt. Livello borgo e rate derivati. Stato di puntatore, selezione e pannelli separato da economia. Nessuna sorgente economica nel renderer.
Comandi: buyActivity, upgradeActivity, assignCreature (spostamento atomico, fallisce se destinazione occupata), encourage, collectProduct, activateFestival, completeProject. Primo sblocco Nibi/Tula può assegnare automaticamente all'attività che li ha sbloccati se libera, altrimenti resta non assegnato. Tutte le azioni restituiscono errore osservabile se non valide senza mutare risorse.

## Salvataggio
localStorage con chiave versionata specifica di questo gioco. Autosave ogni 5s e dopo acquisti/progetti; salvataggio su visibilitychange/pagehide con strategia coerente per advance. Un solo controller del clock e cleanup delle sottoscrizioni, anche con React StrictMode.
Validazione al caricamento e import: numeri finiti non negativi, livelli nei limiti, ID noti, riferimenti coerenti, una creatura per attività. Non sostituire silenziosamente un save corrotto: conservarne copia/esportazione e offrire reset esplicito. Se storage non disponibile, gioco in memoria e avviso discreto persistente 'Il salvataggio non è disponibile'.
Export JSON con schemaVersion e timestamp. Import validato, nessuna eval, conferma prima di sostituire la partita. Reset con conferma. Gestire versione sconosciuta con messaggio, senza migrazione inventata distruttiva.
Più tab: una sola tab scrive/avanza; seconda tab avvisa e va in sola lettura. Consentito Web Locks o soluzione semplice equivalente con gestione takeover esplicita. Test/documentare almeno mancata doppia produzione.

## Prestazioni e accessibilità
Aggiornamento economico UI circa 4Hz, animazioni CSS con transform/opacity, nessun rerender globale a ogni pointermove. Non legare risorse al requestAnimationFrame. Ricalcolo background attraverso advance. Font leggibili, focus visibile, pulsanti touch >=44 CSS px, etichette per lettori schermo, contrasto ragionevole e reduced motion. App in italiano, no debug nel normale prodotto.

## Determinismo
Tempo passato esplicitamente al motore; nessun Math.random necessario per questa slice. Test proprietà: advance(a→c) uguale a advance(a→b→c) entro tolleranza floating point per intervalli sotto cap e senza comandi intermedi. Gli eventi automatici devono essere equivalenti fra modalità. Timer non legati al fuso orario.
