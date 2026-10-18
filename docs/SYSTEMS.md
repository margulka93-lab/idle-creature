> Baseline FIRST_PLAYABLE (storica). Per F02, CODEX_TASK.md e docs/FLOW_REVISION.md prevalgono su acquisti, milestone, prerequisiti, UI, ritorno e migrazione. Accettazione corrente: docs/FLOW_ACCEPTANCE.md; conservare le regressioni tecniche applicabili qui sotto.

# Regole eseguibili

Fonte numerica: design/balance.v1.json. Tutte le durate sono secondi; timestamp persistenti in millisecondi UTC. Ogni comando prima riconcilia la simulazione fino al suo timestamp e poi applica la modifica atomicamente.

## Produzione e acquisti
Attività livello L>=1: baseRate = baseCoinsPerSecond + (L-1)*coinsPerSecondPerLevel. Non posseduta L=0 produce zero.
Per migliorare da L a L+1: ceil(upgradeBaseCost * upgradeCostGrowth^(L-1)). Livello massimo 50. Acquisto iniziale usa purchaseCost e imposta L=1; l'orto è già posseduto. Non dedurre il costo di acquisto due volte.
Bonus assegnazione = 0.10 + 0.02*(livelloCreatura-1) + 0.20 se attività preferita. Senza assegnazione =0.
rate = baseRate * (1+bonusAssegnazione) * (1 + 0.5*incoraggiamentoAttivo + 0.5*festaAttiva).
Il moltiplicatore attivo ha massimo ×2, non ×2.25; assegnazione/crescita sono fattori separati. Il bonus di incoraggiamento segue la creatura se spostata; mai due postazioni contemporaneamente.
Monete spendibili aumentano con tutti i guadagni, lifetimeCoins aumenta con monete effettivamente guadagnate (inclusi premi speciali, esclusi i 25 iniziali). Spendere non riduce lifetimeCoins. Doppio click non può spendere monete inesistenti; ricalcolare requisiti nel motore.

## XP e sblocchi
Creatura livello 1, xpInLevel=0. Per passare da livello L a L+1 servono 50*L XP. Un XP per secondo assegnato a un'attività posseduta, online e offline. Bonus di produzione non aumentano XP. Al livello 20 l'XP viene fermata e il bonus resta quello del livello 20. Crescita automatica, nessun click per riscuotere livelli.
Traguardi lifetimeCoins assegnano cristalli automaticamente una sola volta, senza consumare monete. Attraversare più soglie le assegna tutte. Progetti richiedono prerequisiti e risorse, una volta sola. Non possono essere acquistati prima del precedente. Sblocchi di creature basati su possesso attività vengono risolti nello stesso avanzamento/comando; nessuna ricompensa duplicata al reload. Le tre creature hanno lo stesso schema di talento, applicato all'attività preferita: niente caso speciale hardcoded per nome.

## Incoraggiamento e gesti
Un'azione valida su creatura assegnata imposta encouragedUntil = now+30s. Rinnovo sostituisce la scadenza; non somma durata o potenza. Ignorare rinnovi a meno di 500ms dall'ultimo per la medesima creatura. Trascinamento intenzionale solo dopo soglia 8 CSS px; usare intersezione del segmento del puntatore con hitbox (non solo l'ultimo punto) per non saltare creature su swipe rapidi. Dopo drag non emettere tap di selezione o acquisto. Pointer capture e gestione pointercancel. Mouse senza pulsante non produce bonus.
Il riquadro scena ha touch-action:none, altezza contenuta; il resto della pagina mantiene scroll verticale. Etichetta visibile 'Trascina sulle creature per incoraggiarle'; comando Incoraggia accessibile sempre. Scrolling fuori scena non deve produrre. Un solo puntatore guida il gesto, multitouch non moltiplica output. L'area sensibile coincide con creatura visibile e margine ragionevole, non con l'intera postazione. Bonus visibile con timer, microreazione e tasso aggiornato.

## Ora delle meraviglie
Disponibile dopo progetto Sentiero. Attivazione globale 20s, cooldown 300s calcolato dall'attivazione. Primo uso disponibile appena sbloccata. Non riattivare durante cooldown. Mostrare tempo rimanente e poi ricarica. Incoraggiamento e festa si combinano come formula sopra. Non si attiva automaticamente offline.

## Prodotti speciali
Ogni attività posseduta accumula secondi fino a 180; a soglia crea un singolo prodotto pronto. Finché pronto, contatore congelato: niente accumulo nascosto. Raccolta resetta a zero e premia 10 secondi del tasso corrente dell'attività con crescita/assegnazione ma senza bonus attivi. Premio concorre a lifetimeCoins, non genera XP. Premere o attraversare l'oggetto durante gesto raccoglie una sola volta. Oggetto separato dall'hitbox creatura e comandi tastiera. Offline può maturare al massimo un oggetto per attività. Nessuna scadenza, niente click necessario per le entrate ordinarie.

## Tempo e offline
Una sola funzione advance(state,toTime) per online, ritorno da background, caricamento e strumenti di sviluppo. Non calcolare risorse dagli FPS, non applicare delta offline anche nel successivo tick. Timestamp persistente avanzato anche dopo cap. Massimo 48h di produzione/XP offline; ignorare tempo negativo e non spostare indietro il timestamp di riferimento per evitare doppio guadagno. Per assenze oltre il cap usare i primi 48h dopo lastSimulatedAt per guadagni, poi portare il riferimento al tempo attuale e scadere bonus/cooldown sul wall clock: nessun recupero ripetuto del tempo scartato.
Integrare analiticamente o per eventi: scadenza incoraggiamento, fine festa, livello creatura, soglie premi e maturazione prodotti. Ricalcolare rate quando cambia livello. No loop secondo per secondo per 48h. Il boost attivo residuo al momento di chiudere resta valido solo per il suo tempo residuo, non per l'intera assenza. Cooldown trascorre in assenza. Ripetere advance allo stesso timestamp non cambia nulla. Eventi simultanei con ordine deterministico, nessun ciclo infinito sui bordi.
Riepilogo ritorno: durata conteggiata, monete prodotte, livelli e premi, eventuale limite 48h; si mostra dopo assenza >=60s. Chiuderlo non accredita nulla di nuovo. Nessun acquisto/progetto automatico offline.
