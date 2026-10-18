# F02 — specifica operativa della revisione

## Stato
Revisione richiesta dopo prova umana del 18 ottobre 2026: acquisti uno per volta, assenza di bonus ai livelli e flusso macchinoso. Questa specifica sostituisce le regole v1 in conflitto su acquisti, milestone, UI, prerequisiti progetti e ritorno. Il resto della baseline rimane valido, inclusi tre creature/quattro attività, offline cap48h, asset provvisori e motore indipendente da React. I numeri sono baseline di implementazione da simulare, non dati copiati dagli altri giochi.

## 1. Comprare per obiettivi
Selettore condiviso sempre visibile vicino all'elenco attività: '+1', '+10', 'PROSSIMO', 'MAX'. Default PROSSIMO, preferenza UI ricordata separatamente dal save economico.
+1 acquista un livello. +10 acquista min(10,cap-L) livelli; se non puoi permetterteli tutti resta disabilitato, senza degradare silenziosamente a +1. PROSSIMO compra esattamente fino alla prima milestone strettamente >L tra 10/25/50. MAX compra il massimo intero sostenibile fino al cap, non spende se zero livelli. Al cap tutte le modalità mostrano 'Massimo'.
Non posseduta: sempre singola azione Costruisci, il selettore non acquista più postazioni e non paga upgrade nascosti.
Ogni pulsante mostra il target L→T, numero di livelli, costo intero esatto e produzione passiva prima/dopo. Se attraversa una milestone mostra anche 'Traguardo ×2 incluso'; acquisti che attraversano più soglie includono tutte le moltiplicazioni. Non mostrare solo la differenza lineare.
Costo esatto = somma dei ceil dei prezzi di ciascun livello preesistente: sum(i=L..T-1) ceil(base*growth^(i-1)). Non moltiplicare prezzo corrente per n e non arrotondare un'unica formula geometrica spacciandola per somma esatta. Cap50 rende accettabile somma diretta/prefissi, nessun bisogno di formule approssimate. Riconciliare tempo e riquotare al comando; quote UI non è fonte autoritativa. Un comando atomico, un save, un feedback aggregato: non dispatchare 10 comandi UI. Usare lo stesso calcolatore per anteprima, affordability e comando.
Esempio verificato della baseline: Orto L8→L10 costa 153 monete; creatura preferita L1, senza boost, rate 3.835→9.49/s con milestone ×2. La variazione è +147.5%, non solo il raddoppio: ci sono anche due livelli lineari.

## 2. Progressione a scatti leggibili
Attività: livello10 ×2 produzione di QUELLA attività, 25 altro ×2, 50 altro ×2. Cumulativi ×2/×4/×8, validi online e offline, automatici e non spendibili. Base rate già esistente viene moltiplicata per milestoneFactor. Non ridurre il timer ma mantenere anche la stessa produzione per secondo: in questa economia il bonus è sul rate, niente raddoppio doppio di velocità e resa.
UI: 'Prossimo traguardo: L10 · produzione ×2', barra progresso livelli (L/target, non percentuale monete), costo per raggiungerlo e guadagno finale. Mostrare più tardi il traguardo successivo senza popup di riscossione.
Bulk attraverso soglie: un piccolo feedback aggregato elenca tutte quelle raggiunte. Tassi e bonus DERIVATI dal livello, nessun accumulatore persistente di moltiplicatori da riapplicare a ogni load.
Creature: mantenere XP e +0.02 per livello. A L5 ulteriore +0.10 additivo al bonus di assegnazione quando lavora nell'attività preferita; a L10 durata incoraggiamento45s; a L20 durata60s. Non aggiungere un'altra valuta. Durate nuove si applicano alla prossima carezza, non riscrivono la scadenza già in corso. L20 conserva il bonus L5. Mostrare il prossimo talento e cosa migliora, non solo barra XP.

## 3. Sblocchi coerenti con i traguardi
Non basta aggiungere moltiplicatori ai vecchi costi: la partita collasserebbe più rapidamente verso la fine. Mantenere costi monetari/cristalli della v1 come punto iniziale, ma aggiungere requisiti espliciti:
- Sentiero: Vivaio posseduto + Orto almenoL10 + vecchie risorse.
- Ponte: Sentiero completato + Orto/Vivaio/Mulino ciascuno almenoL10 + vecchie risorse.
- Festa: Ponte completato + tutte le quattro attività almenoL25 + tutte le tre creature almenoL5 + vecchie risorse.
Condizioni visibili con checklist breve e stato raggiunto/mancante, non messaggio generico 'prerequisiti'. Nessun reset o blocco per progetti già completati in save v1. Il nuovo stato di completamento storico resta vero anche se i requisiti sono cambiati.
Resta una slice finita: L50 è massimo, la Festa rimane la conclusione. Non fingere di aver creato giorni di contenuto; dopo cap spiegare chiaramente 'Prototipo completato'. Nuovi quartieri o prestigio richiedono altro incarico.

## 4. Schermata di gioco diretta
Schermata Borgo = scena + elenco compatto operativo visibile senza cambiare sezione. Ogni riga: icona, nome, L attuale, reddito passivo, traguardo e pulsante upgrade; occupazione creatura leggibile. Tutte le attività esistenti confrontabili; attività bloccate mostrano il requisito prossimo senza occupare spazio con istruzioni lunghe.
Desktop: scena + elenco; inspector dettagli richiesto da una selezione, non necessario per comprare. Mobile390px: scena compatta, selettore sticky nell'area lista e righe impilate con pulsanti >=44px; non tabella orizzontale da scrollare. Progetti accessibili dalla schermata Borgo come prossima azione essenziale. Creature/Collezione restano per dettagli, non obbligatori per spendere o seguire il prossimo obiettivo.
Non spostare la lista, riordinarla o ricreare il focus a ogni tick. Nessuna conferma modale sugli acquisti normali. Il costo mostrato arrotondato deve coincidere con l'intero spendibile. Rendere leggibili 1.2k/1.2M se necessario con valore preciso accessibile. Concentrare titoli editoriali, spiegazioni lunghe e avviso SVG nelle impostazioni/crediti, lasciando spazio alle azioni.

## 5. Feedback e sessioni
Carezze: feedback locale della creatura, timer e +50% visibili. A parità di creatura e scadenza, rinnovi scartati dal throttle non producono messaggi d'errore continui né toast globali. Gesto rapido può coinvolgere più creature. Non cambiare la produzione normale in raccolta obbligatoria.
Ritorno: guadagni già accreditati mostrati in banner non modale, espandibile; si può comprare immediatamente senza 'Rientra' obbligatorio. Backup/reset/import rimangono protetti da conferma.
Traguardi: piccoli segnali integrati e persistenti nel riepilogo finché consultabili; niente sequenza di popup o pulsanti 'riscuoti'. Feedback in reduced motion testuale e stato aggiornato.
Assegnazioni: default già sensati; si possono cambiare nei dettagli. Non aggiungere un giro di manutenzione delle postazioni come prerequisito di ogni visita.

## 6. Dati e compatibilità
Integrare design/flow.v2.json nella configurazione runtime senza due fonti numeriche in conflitto; balance.v1 resta leggibile come baseline storica. Dichiarare quale configurazione è effettiva. Valido aggiornarne il contenuto e version a2 conservando baseline in docs/archive.
Aggiungere economyVersion=2 ai nuovi export; import v1 senza campo è legacy accettato e normalizzato. Conservare monete, lifetimeCoins, XP, livelli, progetti completati e risorse. Nessun guadagno passato ricalcolato e nessun premio una tantum aggiuntivo. Milestone derivate si attivano per produzione futura. Conservare una copia esportabile pre-aggiornamento. Riconciliare un save v1 fino all'istante migrazione con regole v1, poi applicare v2 da quell'istante: l'assenza pre-update non riceve moltiplicatori retroattivi. Se un'importazione v1 avviene a più riprese, timestamp aggiornati evitano credito doppio. Validazione delle nuove versioni esplicita.
Modificare i test che assumevano requisiti precedenti per nuovi save, senza cancellare regressioni di import legacy. Non annullare la protezione multischeda o il cap offline.

## 7. Bilanciamento e prove
Non usare il differenziale a24h di due partite ormai al cap come unica misura della carezza. Confrontare finestre prima della saturazione: 0–5min, 5–15min, 15–30min, primo ritorno a1h e orizzonte24h. Politiche passive/attive con medesimi tempi di acquisto/visita, differenza solo negli input bonus. Registrare acquisti, tempi di soglia, tempo per prossimo obiettivo e reddito, non solo monete finali.
Scenari click-burden: save L1 con soldi esatti fino10 (9 click v1→1 PROSSIMO); save L8 con153 monete (2→1); save di ritorno con grande saldo (MAX un comando/postazione). Non promettere che il giocatore in povertà compra sempre10 livelli: quando il saldo è basso il bulk non crea soldi. Valutare anche risparmio verso un obiettivo e acquisto marginale, così non si misura solo una politica che compra +1 appena possibile.
Target iniziali, non garanzie: primo upgrade possibile immediatamente, primo L10 raggiungibile con gioco normale in3–8min, secondo abitante prima di10min, almeno una decisione sensata per minuto nella prima fase senza tap obbligatori. La Festa non dovrebbe anticipare drasticamente la v1 per effetto dei soli moltiplicatori; motivare tempi osservati. Nessuna attesa artificiale da timer nuovo.
Tuning autorizzato dopo simulazione: costi base, crescita costi nell'intervallo1.12–1.22, prezzo acquisto/progetti e soglie cristalli. Non alterare semantica +1/+10/NEXT/MAX o eliminare milestone per fare passare una simulazione. Mantenere cristalli totali sufficienti per progetti. Riportare ogni numero cambiato e perché. Il gate finale di divertimento rimane un nuovo playtest umano.
