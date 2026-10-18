# F02 — accettazione

## Acquisti
- Default PROSSIMO; modalità +1/+10/PROSSIMO/MAX con significato esatto e preferenza stabile.
- OrtoL8→L10 costa153 con configurazione originale; quote e command concordano. Zero fondi, fondi esatti, insufficienti, cap e ultimo blocco parziale gestiti.
- +10 disabilitato se mancano fondi al blocco; target cappato a50. PROSSIMO non supera la soglia prossima. MAX massimale: il successivo livello non è sostenibile.
- Bulk equivale a sequenza singola allo stesso istante, includendo tutte le milestone, senza XP o tempo gratis e senza doppia spesa.
- Anteprima indipendente dai bonus temporanei per confronto stabile; rate attivo separato. Anteprima include assegnazione/talenti/milestone effettivi.

## Progressione
- Livelli9/10,24/25,49/50: fattori1/2/2/4/4/8; offline e online coerenti; reload non moltiplica nuovamente.
- CreatureL5 talento preferita +0.10, L10 carezza45s, L20 carezza60s; solo futura carezza usa nuova durata; offline attraversa soglie correttamente.
- Nuovi progetti richiedono livelli come specificato; vecchi progetti completati non vengono annullati. Cristalli totali sufficienti.

## UX
- Upgrade di ogni attività posseduta eseguibile dalla lista Borgo con UN click, senza prima aprire inspector/sezioni; indicare numero reale di azioni prima/dopo.
- Tutte le righe mostrano livello, produzione, target e costo. Nessun target mobile sotto44px e nessun overflow a360/390px. Il tick non ruba focus o sposta la riga.
- Nessun popup obbligatorio per ritorno/traguardo/acquisto. Reset/import restano confermati.
- Non mostrare toast 'Carezza già ricevuta' durante swipe continuo; feedback locale utile con reduced motion. Niente guadagni da hover.

## Persistenza e regressioni
- V1 migrato con risorse/livelli/progetti preservati; tempo precedente migrazione riconciliato con regolev1; v2 applicata solo dopo. Exportv2 validato, future version rifiutate recuperabilmente; conservare backup.
- Tutti i test pertinenti di offline48h, tempo inverso, idempotenza, assegnazione, import/export e multitab restano verdi o aggiornati per regole intenzionalmente diverse.

## Evidenze
Build/typecheck/test, E2E e screenshot reali se disponibili. Simulazioni prima/dopo con politiche uguali a5/15/30min/1h/24h e visita dopo assenza. Tracciare tempo soglie, numero acquisti UI, rapporto prima del cap e tempi morti. Segnalare eventuali target di ritmo non raggiunti; niente tuning silenzioso o test auto-confermanti.
Non dichiarare validata la fluidità senza playtest umano. La PR documentale di F02 non è già implementazione.
