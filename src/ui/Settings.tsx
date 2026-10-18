import { useRef, useState } from "react";
import { downloadSave, game } from "./store";
export function Settings({
  readOnly,
  onClose,
}: {
  readOnly: boolean;
  onClose: () => void;
}) {
  const snap = game.snapshot;
  const [importText, setImportText] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const setSettings = (_open: boolean) => onClose();
  return (
    <section className="settings" aria-label="Salvataggio e impostazioni">
      <div className="settings-heading">
        <h2>La tua partita</h2>
        <button className="secondary" onClick={() => setSettings(false)}>
          Chiudi impostazioni
        </button>
      </div>
      <p>
        Salvataggio locale ogni 5 secondi e dopo le azioni. Un’esportazione
        permette di conservare la partita fuori da questo browser.
      </p>
      <p>
        Economia v2 · bonus automatici, acquisti multipli e talenti. Illustrazioni
        originali integrate, in attesa di approvazione artistica. Risorse SVG di
        riserva disponibili se un’immagine non viene caricata.
      </p>
      {snap.backup && (
        <button
          className="secondary"
          onClick={() => downloadSave(snap.backup!, "borgo-pre-F02-v1.json")}
        >
          Esporta backup pre-F02
        </button>
      )}
      <div className="settings-actions">
        <button
          onClick={() => {
            game.tick();
            downloadSave(
              JSON.stringify(game.snapshot.state, null, 2),
              `borgo-${Date.now()}.json`,
            );
          }}
        >
          Esporta partita JSON
        </button>
        <button disabled={readOnly} onClick={() => file.current?.click()}>
          Importa file JSON
        </button>
        <button className="secondary" disabled={readOnly} onClick={game.reset}>
          Riparti da zero
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (f.size > 100_000)
              game.emit({
                message: "Importazione rifiutata: file troppo grande.",
              });
            else game.importSave(await f.text());
          }
          e.target.value = "";
        }}
      />
      <label htmlFor="import-json">Oppure incolla un salvataggio JSON</label>
      <textarea
        id="import-json"
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        maxLength={100_001}
      />
      <button
        disabled={readOnly || !importText.trim()}
        onClick={() => game.importSave(importText)}
      >
        Valida e importa
      </button>
      <p role="status" className="settings-result">{snap.message}</p>
    </section>
  );
}
