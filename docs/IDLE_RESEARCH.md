# Studio comparativo — fluidità degli idle (18 ottobre 2026)

## Metodo e limiti
Ricerca documentale di fonti ufficiali, analisi del codice del nostro App.tsx e motore FIRST_PLAYABLE, e controllo numerico locale. Non è una sessione di gioco osservata dentro le app concorrenti. Alcuni articoli del vecchio supporto Futureplay redirigono a login e il nuovo centro non è leggibile dal tool: non ne inferiamo percentuali o soglie. Fonte secondaria esplicitamente marcata sotto per la semantica dei pulsanti AdVenture Capitalist. Nessuna classifica di popolarità o benchmark dichiarato.

## Cosa trasferire
| Riferimento | Meccanica documentata | Principio utile | Applicazione nostra |
|---|---|---|---|
| AdVenture Capitalist | Buy Next/Max e acquisti multipli (wiki comunitaria); la guida di Pecorella illustra i picchi ai moltiplicatori | Scegliere una soglia, non premere decine di volte lo stesso bottone | +1/+10/PROSSIMO/MAX; costo totale e anteprima soglie |
| Idle Farming Empire | Presentazione ufficiale: tap/swipe, automazione, bonus meteo e prestigio | Un gesto breve produce un risultato percepibile mentre la base procede sola | Manteniamo carezza e raccolta speciale; feedback locale, nessun meteo/prestigio aggiunto |
| Idle Miner Tycoon | Supporto ufficiale: avanzamento, upgrade e traguardi di sblocco con ricompense | Il progresso deve avere obiettivi riconoscibili | Soglie automatiche e prossimo obiettivo sempre leggibile; niente bottleneck di trasporto |
| Cookie Clicker e Clicker Heroes | Discussione comparativa dell'autore in Math of Idle Games II–III, relativa ai modelli economici e al prestigio | Esistono strutture diverse: non serve copiarle tutte | Rinviamo catene di generatori/prestigio; il ciclo base deve reggere prima |

Il materiale economico di Pecorella descrive come bonus alle soglie possano cambiare la convenienza relativa dei generatori e come i costi esponenziali superino la crescita ordinaria. Per il nostro gioco serve decidere quando attendere un traguardo e quando espandere, invece di avere incrementi uniformi. Questo è il ragionamento progettuale applicato, non una promessa che una singola formula generi divertimento.

## Diagnosi del nostro prototipo
1. App.tsx obbliga la selezione della postazione, poi mostra upgrade da un solo livello nell'inspector. Questo aumenta navigazione e ripetizione.
2. Il motore usa costo ceil(base*1.16^(L-1)) e reddito lineare nel livello: nessun premio attività a10/25/50. A salire, compri passi sempre meno incisivi.
3. Creature: +0.02 al bonus per livello, senza talenti di soglia. XP cambia gradualmente ma non introduce aspettative nuove.
4. L'interfaccia enfatizza intestazioni/frasi, dettagli e più sezioni; l'azione ricorrente è poco compatta. Il ritorno usa un dialogo da chiudere prima di agire.
5. Tre progetti e cap50: la slice è tecnicamente finita. Non ha senso valutarla come un idle di giorni, o aumentare bonus senza ricollegare obiettivi.
6. Il report v1 confronta a24h due politiche entrambe al cap. Il +0.57% misura quell'orizzonte e quelle visite, non la soddisfazione del gesto né il vantaggio prima degli sblocchi.

## Esempio numerico verificato localmente
OrtoL8, creatura preferitaL1, nessun boost: 3.835/s. Prezzi per8→9 e9→10: ceil(25*1.16^7)=71 e ceil(25*1.16^8)=82, totale153. Con L10×2: 9.49/s, +147.5%. È una verifica della formula candidata; non è esecuzione dei test dell'app modificata.
Un modello esplorativo semplificato a passi1s (non il motore React) ha evidenziato che i moltiplicatori anticipano fortemente il cap. Per questo F02 richiede simulazioni vere e prerequisiti ai progetti, senza presentare il modello semplificato come validazione della nuova economia.

## Applicazione e ordine
F02 tratta insieme acquisti multipli, milestone e flusso della schermata. Asset illustrati definitivi, nuovi quartieri, monetizzazione e sistemi aggiuntivi sono fuori. La revisione è documentata in FLOW_REVISION e CODEX_TASK; non cambia ancora il codice runtime.

## Fonti consultate
- Anthony Pecorella, lead producer mobile AdVenture Capitalist, Math of Idle Games I: https://www.kongregate.com/en/pages/the-math-of-idle-games-part-i
- Stesso autore, modelli alternativi II: https://www.kongregate.com/en/pages/the-math-of-idle-games-part-ii
- Stesso autore, prestigio e limiti delle simulazioni III: https://www.kongregate.com/en/pages/the-math-of-idle-games-part-iii
- AdVenture Capitalist supporto ufficiale, unlock: https://screenzilla.helpshift.com/hc/en/5-adventure-capitalist/faq/506-unlocks-have-incorrect-descriptions/
- Fonte secondaria, Buy Multiplier, comunità: https://adventure-capitalist.fandom.com/wiki/Buy_Multiplier
- Idle Farming Empire, presentazione ufficiale dello sviluppatore su App Store: https://apps.apple.com/gb/app/idle-farming-empire/id1018795567?platform=ipad
- Idle Miner Tycoon supporto ufficiale, cash e milestone: https://kolibri-games.helpshift.com/hc/en/3-idle-miner-tycoon/faq/38-how-can-i-get-more-in-game-cash/?p=web
- Supporto ufficiale Idle Miner, esempi di premi milestone evento: https://kolibri-games.helpshift.com/hc/en/3-idle-miner-tycoon/faq/179-what-is-the-free-pass-premium-pass/
- Cookie Clicker, sito ufficiale consultato come riferimento, non testato interattivamente: https://orteil.dashnet.org/cookieclicker/
