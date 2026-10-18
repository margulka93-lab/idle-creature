import {
  advance,
  command,
  createState,
  returnSummary,
  type Command,
  type State,
} from "../core/engine";
import { activities, projects } from "../content";
import { load, parseSave, save, SAVE_KEY } from "../persistence/save";
type Snapshot = {
  state: State;
  warning: string;
  corrupt: string | null;
  readOnly: boolean;
  ready: boolean;
  message: string;
  summary: ReturnType<typeof returnSummary> | null;
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
  };
  listeners = new Set<() => void>();
  offset = 0;
  timer: ReturnType<typeof setInterval> | undefined;
  lastSaved = 0;
  release: (() => void) | undefined;
  generation = 0;
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
      this.emit({ state: parseSave(event.newValue) });
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
            const loaded = load(storage(), this.now());
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
          const state = loaded.corrupt
            ? loaded.state
            : advance(loaded.state, this.now());
          const summary = returnSummary(loaded.state, state);
          this.emit({
            state,
            ready: true,
            readOnly: false,
            warning: loaded.warning ?? "",
            corrupt: loaded.corrupt ?? null,
            summary: summary.elapsed >= 60 && !loaded.corrupt ? summary : null,
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
    const result = command(this.snapshot.state, action, this.now());
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
      const state = advance(imported, this.now());
      const summary = returnSummary(imported, state);
      this.emit({
        state,
        corrupt: null,
        warning: "",
        summary: summary.elapsed >= 60 ? summary : null,
        message: "Partita importata",
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
    this.emit({
      state: createState(this.now()),
      corrupt: null,
      warning: "",
      summary: null,
      message: "Un nuovo inizio",
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
    for (const a of activities) {
      if (!this.snapshot.state.activities[a.id])
        this.dispatch({ type: "buyActivity", id: a.id });
      for (const p of projects)
        this.dispatch({ type: "completeProject", id: p.id });
    }
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
