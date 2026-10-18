import {
  advance,
  command,
  createState,
  returnSummary,
  quoteUpgrade,
  type Command,
  type State,
} from "../core/engine";
import { activities, projects } from "../content";
import {
  load,
  parseSave,
  normalizeSave,
  save,
  SAVE_KEY,
  BACKUP_KEY,
} from "../persistence/save";
type Snapshot = {
  state: State;
  warning: string;
  corrupt: string | null;
  readOnly: boolean;
  ready: boolean;
  message: string;
  summary: ReturnType<typeof returnSummary> | null;
  backup: string | null;
  upgradeFeedback: Record<string, string>;
};
const memoryStorage = {
  getItem: () => null,
  setItem: () => {
    throw new Error("Storage unavailable");
  },
};
function storage() {
  try {
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
}
class GameStore {
  snapshot: Snapshot = {
    state: createState(Date.now()),
    warning: "",
    corrupt: null,
    readOnly: true,
    ready: false,
    message: "",
    summary: null,
    backup: null,
    upgradeFeedback: {},
  };
  listeners = new Set<() => void>();
  offset = 0;
  timer: ReturnType<typeof setInterval> | undefined;
  lastSaved = 0;
  release: (() => void) | undefined;
  generation = 0;
  backupPending: string | undefined;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.snapshot;
  emit = (patch: Partial<Snapshot>) => {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((fn) => fn());
  };
  now = () => Date.now() + this.offset;
  persist = () => {
    if (this.snapshot.readOnly || this.snapshot.corrupt) return;
    if (this.backupPending) {
      try {
        const existing = storage().getItem(BACKUP_KEY);
        if (!existing) storage().setItem(BACKUP_KEY, this.backupPending);
        this.emit({ backup: existing ?? this.backupPending });
        this.backupPending = undefined;
      } catch {
        this.emit({
          warning:
            "Backup pre-F02 disponibile in memoria: esportalo. La partita originale resta nello storage.",
        });
        return;
      }
    }
    if (!save(storage(), this.snapshot.state))
      this.emit({ warning: "Il salvataggio non è disponibile" });
    this.lastSaved = Date.now();
  };
  tick = (force = false) => {
    if (!force && document.hidden) return;
    if (this.snapshot.readOnly || this.snapshot.corrupt) return;
    const before = this.snapshot.state;
    const state = advance(before, this.now());
    const summary = returnSummary(before, state);
    this.emit({ state, ...(summary.elapsed >= 60 ? { summary } : {}) });
    if (Date.now() - this.lastSaved >= 5000) this.persist();
  };
  onVisibility = () => {
    this.tick(true);
    this.persist();
  };
  onStorage = (event: StorageEvent) => {
    if (!this.snapshot.readOnly || event.key !== SAVE_KEY || !event.newValue)
      return;
    try {
      const saved = parseSave(event.newValue);
      this.emit({ state: { ...saved, economyVersion: 2 } });
    } catch {
      this.emit({ warning: "Salvataggio aggiornato non valido." });
    }
  };
  acquire = async (generation = this.generation) => {
    if (!navigator.locks) {
      this.emit({
        ready: true,
        warning:
          "Il browser non supporta il controllo delle schede. Apri il gioco in un browser aggiornato.",
        readOnly: true,
      });
      return;
    }
    await navigator.locks
      .request(
        "borgo-creature.writer.v1",
        { ifAvailable: true },
        async (lock) => {
          if (generation !== this.generation) return;
          if (!lock) {
            const loaded = load(storage(), this.now(), true);
            this.emit({
              ready: true,
              readOnly: true,
              state: loaded.state,
              warning: loaded.warning ?? "",
              corrupt: loaded.corrupt ?? null,
            });
            return;
          }
          const loaded = load(storage(), this.now());
          this.backupPending = loaded.migrationBackup;
          let backup = loaded.migrationBackup ?? null;
          try {
            backup = storage().getItem(BACKUP_KEY) ?? backup;
          } catch {
            /* Memory-only export remains available. */
          }
          const state = loaded.corrupt
            ? loaded.state
            : advance(loaded.state, this.now());
          const summary = returnSummary(loaded.previous ?? loaded.state, state);
          this.emit({
            state,
            ready: true,
            readOnly: false,
            warning: loaded.warning ?? "",
            corrupt: loaded.corrupt ?? null,
            summary: summary.elapsed >= 60 && !loaded.corrupt ? summary : null,
            backup,
          });
          this.persist();
          await new Promise<void>((resolve) => {
            this.release = resolve;
          });
        },
      )
      .catch(() =>
        this.emit({
          ready: true,
          readOnly: true,
          warning:
            "Il controllo delle schede non è disponibile. Ricarica in un browser aggiornato.",
        }),
      );
  };
  start = () => {
    const generation = ++this.generation;
    queueMicrotask(() => {
      if (generation === this.generation) void this.acquire(generation);
    });
    this.timer = setInterval(this.tick, 250);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pagehide", this.onVisibility);
    window.addEventListener("storage", this.onStorage);
    return () => {
      this.generation++;
      this.onVisibility();
      clearInterval(this.timer);
      this.release?.();
      document.removeEventListener("visibilitychange", this.onVisibility);
      window.removeEventListener("pagehide", this.onVisibility);
      window.removeEventListener("storage", this.onStorage);
    };
  };
  dispatch = (action: Command) => {
    if (this.snapshot.readOnly || this.snapshot.corrupt) return;
    const now = this.now();
    const reconciled = advance(this.snapshot.state, now);
    const result = command(this.snapshot.state, action, now);
    if (action.type === "encourage") {
      this.emit({ state: result.state });
      if (!result.error) this.persist();
      return;
    }
    if (action.type === "upgradeActivity" && !result.error) {
      const q = quoteUpgrade(reconciled, action.id, action.mode ?? "1");
      const feedback = `L${q.from} → L${q.target} · ${q.count} livelli${q.milestones.length ? ` · Traguardi ${q.milestones.map((m) => `L${m.level} ×${m.factor}`).join(", ")}` : ""}`;
      this.emit({
        state: result.state,
        upgradeFeedback: {
          ...this.snapshot.upgradeFeedback,
          [action.id]: feedback,
        },
      });
      this.persist();
      return;
    }
    if (action.type === "buyActivity" && !result.error) {
      this.emit({
        state: result.state,
        upgradeFeedback: {
          ...this.snapshot.upgradeFeedback,
          [action.id]: "Attività costruita · L1",
        },
      });
      this.persist();
      return;
    }
    const success: Record<Command["type"], string> = {
      encourage: "Carezza ricevuta · produzione +50% per 30s",
      buyActivity: "Una nuova attività nel borgo!",
      upgradeActivity: "Attività migliorata",
      assignCreature: "Assegnazione aggiornata",
      collectProduct: "Prodotto raccolto",
      activateFestival: "È l’Ora delle meraviglie!",
      completeProject: "Progetto completato!",
    };
    this.emit({
      state: result.state,
      message: result.error ?? success[action.type],
    });
    this.persist();
  };
  importSave = (raw: string) => {
    if (this.snapshot.readOnly) return;
    try {
      const imported = parseSave(raw);
      if (
        !window.confirm(
          "Sostituire la partita attuale con il salvataggio importato?",
        )
      )
        return;
      const state = advance(normalizeSave(imported, this.now()), this.now());
      if (imported.economyVersion !== 2) this.backupPending = raw;
      const summary = returnSummary(imported, state);
      this.emit({
        state,
        corrupt: null,
        warning: "",
        summary: summary.elapsed >= 60 ? summary : null,
        message: "Partita importata",
        backup:
          this.snapshot.backup ?? (imported.economyVersion !== 2 ? raw : null),
        upgradeFeedback: {},
      });
      this.persist();
    } catch (e) {
      this.emit({ message: `Importazione rifiutata: ${(e as Error).message}` });
    }
  };
  reset = () => {
    if (
      this.snapshot.readOnly ||
      !window.confirm("Ripartire da zero? La partita corrente sarà sostituita.")
    )
      return;
    this.offset = 0;
    this.backupPending = undefined;
    this.emit({
      state: createState(this.now()),
      corrupt: null,
      warning: "",
      summary: null,
      message: "Un nuovo inizio",
      upgradeFeedback: {},
    });
    this.persist();
  };
  debugAdvance = (seconds: number) => {
    if (!import.meta.env.DEV || this.snapshot.readOnly || this.snapshot.corrupt)
      return;
    this.offset += seconds * 1000;
    this.tick();
    this.persist();
  };
  debugUnlock = () => {
    if (!import.meta.env.DEV || this.snapshot.readOnly || this.snapshot.corrupt)
      return;
    this.debugAdvance(86400);
    for (let pass = 0; pass < 2; pass++) {
      for (const a of activities) {
        if (!this.snapshot.state.activities[a.id])
          this.dispatch({ type: "buyActivity", id: a.id });
        if (this.snapshot.state.activities[a.id] < 25)
          this.dispatch({ type: "upgradeActivity", id: a.id, mode: "next" });
        for (const p of projects)
          this.dispatch({ type: "completeProject", id: p.id });
      }
      this.debugAdvance(3600);
    }
    for (const p of projects)
      this.dispatch({ type: "completeProject", id: p.id });
  };
}
export const game = new GameStore();
export function downloadSave(raw: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
