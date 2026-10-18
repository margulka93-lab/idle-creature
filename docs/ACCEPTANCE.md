# Criteri di accettazione FIRST_PLAYABLE

Ogni riga deve avere esito ed evidenza nel report. Non sostituire verifica del gioco con soli test di rendering.

1. Da clone pulito, install e dev funzionano secondo README; build, typecheck e unit test verdi.
2. Partenza esatta: 25 monete, orto L1, Momo assegnato, borgo L1; nessun altro acquisto nascosto.
3. Produzione cresce senza input; upgrade mostra costo, differenza di tasso e modifica coerente. Fondi insufficienti non mutano stato. Acquisti ripetuti e ultimo livello gestiti.
4. Incoraggiamento ×1.5 per 30s, rinnovo senza cumulo; hover fermo non produce; swipe attraversa più creature senza perdere hitbox e senza comprare; tastiera equivalente.
5. Mobile: scroll fuori scena non attiva bonus; gesture scena non trascina la pagina; pointercancel non lascia trascinamento attivo; tap seleziona senza spendere.
6. Ora delle meraviglie: accessibile dopo Sentiero, dura 20s, ricarica 300s; con carezze fattore attivo massimo ×2. Timer e disabilitazione coerenti dopo reload.
7. Prodotti: 180s, max1 per attività anche offline; raccolta unica e premio corretto; entrate normali non richiedono raccolta.
8. XP automatico, più livelli nello stesso advance, limite 20, bonus aggiornato al momento giusto. Riassegnazione gratis senza doppio bonus o produzione retroattiva.
9. Tutti i traguardi cristalli una sola volta; spesa non riduce lifetime; sequenza vivaio/Nibi, Sentiero/mulino/Tula, Ponte/laboratorio, Festa raggiungibile senza bonus attivi e senza fortuna. Premi cristalli sufficienti.
10. advance idempotente, partizionamento coerente, guadagno online/offline equivalente; scadenze e salti multipli integrati. Test assenze 0/60s/1h/48h/>48h e tempo all'indietro. Nessun doppio accredito al rientro/reload/riepilogo.
11. Save/load/export/import conservano stato; dati corrotti/versione sconosciuta/storage negato danno messaggi recuperabili. Reset esplicito. Più tab non duplicano produzione.
12. Browser desktop 1440x900 e mobile 390x844 (anche controllo 360px): tutti i pulsanti e pannelli realmente funzionanti, assenza overflow, focus e reduced motion. Se browser non disponibile, riportarlo e non inventare screenshot.
13. Scena leggibile e creature separate animate minimamente; fondale e strutture statici. Asset locali, zero errori risorse/console osservati dove browser disponibile; fallback artistico dichiarato.
14. Simulazione 24h passiva e attiva con politiche riportate: nessun NaN, saldo negativo o deadlock; tempi di sblocco e differenziale documentati. Segnalare attese >30min prima del primo progetto e attività chiaramente dominanti; ritocchi numerici motivati se necessari. Non sostenere che simulazione dimostri divertimento.
15. README e report completi; branch e PR/commit consegnati; niente merge o deploy.

## Prova manuale breve
Avvia → incoraggia Momo → osserva rate e scadenza → compra upgrade → verifica salvataggio con reload → usa strumenti sviluppo per avanzare e sbloccare vivaio → assegna/trascina → completa progetti → chiudi e riapri con clock controllato → verifica riepilogo e raccolta → verifica navigazione e export/import. Prova percorso normale senza debug per valutare i primi minuti, non solo partita accelerata.
