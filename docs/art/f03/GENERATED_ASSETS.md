# Risorse originali F03 — candidate integrate

Riferimento di stile: [primo concept](../concept-reference.jpg). Generazione nativa `image_gen.imagegen`, otto immagini originali indipendenti. Nessuna API, chiave, dipendenza o costo runtime. I prompt effettivamente inviati e le associazioni soggetto/nome sono archiviati in [generation-calls.json](generation-calls.json); il percorso della reference è reso relativo per portabilità. La data UTC dei tool è il 18 ottobre; lavorazione locale conclusa il 19 ottobre 2026.

## File e stato

| ID          | Master PNG              | Runtime WebP                 | Dimensioni runtime | Trasparenza |
| ----------- | ----------------------- | ---------------------------- | ------------------ | ----------- |
| background  | masters/background.png  | /assets/f03/background.webp  | 1448×1086          | opaco       |
| orto        | masters/orto.png        | /assets/f03/orto.webp        | 768×768            | alpha reale |
| vivaio      | masters/vivaio.png      | /assets/f03/vivaio.webp      | 768×768            | alpha reale |
| mulino      | masters/mulino.png      | /assets/f03/mulino.webp      | 768×768            | alpha reale |
| laboratorio | masters/laboratorio.png | /assets/f03/laboratorio.webp | 768×768            | alpha reale |
| momo        | masters/momo.png        | /assets/f03/momo.webp        | 512×512            | alpha reale |
| nibi        | masters/nibi.png        | /assets/f03/nibi.webp        | 512×512            | alpha reale |
| tula        | masters/tula.png        | /assets/f03/tula.webp        | 512×512            | alpha reale |

I master sprite sono 1254×1254. Tutti gli otto output sono stati ispezionati come immagini, poi importati e verificati negli screenshot del gioco. Sfondo senza UI o creature incorporate; gli edifici funzionali sono livelli indipendenti. Nel paesaggio rimane una piccola torre decorativa distante, senza funzione o sblocco. La composizione rappresenta terrazze erbose, corso d’acqua e sentiero; i pad restano liberi. Le sette risorse isolate hanno alpha minimo 0 e massimo 255: non fondali bianchi o scacchiere stampate.

`npm run assets:export` controlla dimensioni/alpha ed esporta con Sharp; esegue esclusivamente resize proporzionale e codifica WebP. Non ritaglia, dipinge o corregge i soggetti. La dimensione totale dei runtime è circa 1,37 MB. Risultati esatti in [asset-audit.json](asset-audit.json).

Il renderer legge `src/content/art-manifest.json`: dimensioni, pivot, scala, ancoraggi normalizzati, variante mobile e margine hitbox. Il fondale usa cover proporzionale; gli ancoraggi condividono la medesima trasformazione. Il prodotto viene mantenuto dentro il viewport. Margine hitbox creature 8 px; sprite minimo104px, pulsante minimo88px sui formati normali. Scena desktop/mobile controllata nel browser, incluse due creature e raccolta. Gli SVG F02 restano riserva per errori di caricamento, verificati abortendo le richieste WebP.

## Cosa è implementato e cosa richiede revisione

Le immagini sono realmente integrate e interattive; non mockup della UI. Tutti i testi e i comandi sono HTML. Edifici, acqua e vegetazione sono fermi. I tre sprite hanno respiro/oscillazione discreta e breve reazione CSS alla carezza; il bonus resta leggibile con movimento ridotto. Non sono state prodotte sequenze disegnate di blink o mani/piedi separati.

Queste sono **candidate artistiche originali**, non master definitivamente approvati dall’utente. Coerenza finale delle identità, scala relativa degli edifici e eventuali animazioni disegnate richiedono revisione artistica/playtest umano. La pipeline, i master e il manifest consentono sostituzioni senza cambiare economia o salvataggi. Gli screenshot di UI reali sono separati, in `docs/screenshots/f03`, e la registrazione in `docs/recordings/f03-mobile.webm`.
