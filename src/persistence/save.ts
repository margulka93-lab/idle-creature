import { activities, balance as b, creatures, projects } from "../content";
import { createState, type State } from "../core/engine";
import {
  advance as advanceLegacy,
  type State as LegacyState,
} from "../core/legacy-v1";
export const SAVE_KEY = "borgo-creature.save.v1";
export const BACKUP_KEY = "borgo-creature.pre-f02.v1";
export type SavedState = State | (LegacyState & { economyVersion?: 1 });
/** Reconcile the old interval with frozen v1 rules, then switch only future rates. */
export function normalizeSave(s: SavedState, now: number): State {
  if (s.economyVersion === 2) return s;
  return { ...advanceLegacy(s, now), economyVersion: 2 };
}
export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
const num = (v: unknown): v is number =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  v >= 0 &&
  v <= Number.MAX_SAFE_INTEGER;
const integer = (v: unknown): v is number => num(v) && Number.isInteger(v);
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const exactKeys = (v: Record<string, unknown>, ids: string[]) =>
  Object.keys(v).length === ids.length &&
  ids.every((id) => Object.hasOwn(v, id));
export function parseSave(raw: string): SavedState {
  if (raw.length > 100_000) throw new Error("Salvataggio troppo grande.");
  const v: unknown = JSON.parse(raw);
  if (!record(v) || v.schemaVersion !== 1)
    throw new Error("Versione del salvataggio sconosciuta.");
  if (
    v.economyVersion !== undefined &&
    v.economyVersion !== 1 &&
    v.economyVersion !== 2
  )
    throw new Error("Versione economica sconosciuta.");
  if (
    ![
      "coins",
      "lifetimeCoins",
      "crystals",
      "festivalEndsAt",
      "festivalReadyAt",
      "lastSimulatedAt",
    ].every((k) => num(v[k])) ||
    !integer(v.crystals)
  )
    throw new Error("Risorse o tempi non validi.");
  if (
    !record(v.activities) ||
    !exactKeys(
      v.activities,
      activities.map((a) => a.id),
    ) ||
    !activities.every(
      (a) =>
        integer((v.activities as Record<string, unknown>)[a.id]) &&
        Number((v.activities as Record<string, unknown>)[a.id]) >=
          a.startLevel &&
        Number((v.activities as Record<string, unknown>)[a.id]) <=
          b.activityMaxLevel,
    )
  )
    throw new Error("Livelli attività non validi.");
  if (
    !Array.isArray(v.completedProjects) ||
    !v.completedProjects.every((p, i) => p === projects[i]?.id)
  )
    throw new Error("Sequenza progetti non valida.");
  if (
    !Array.isArray(v.claimedMilestoneIds) ||
    new Set(v.claimedMilestoneIds).size !== v.claimedMilestoneIds.length ||
    !v.claimedMilestoneIds.every((id) => b.milestones.some((m) => m.id === id))
  )
    throw new Error("Traguardi non validi.");
  if (
    !record(v.creatures) ||
    !exactKeys(
      v.creatures,
      creatures.map((c) => c.id),
    )
  )
    throw new Error("Creature non valide.");
  const occupied = new Set<string>();
  for (const def of creatures) {
    const c = v.creatures[def.id];
    if (
      !record(c) ||
      typeof c.unlocked !== "boolean" ||
      !integer(c.level) ||
      c.level < 1 ||
      c.level > b.creatureMaxLevel ||
      !num(c.xpInLevel) ||
      c.xpInLevel >= b.creature.xpToNextLevelBase * c.level ||
      (c.level === b.creatureMaxLevel && c.xpInLevel !== 0) ||
      !num(c.encouragedUntil) ||
      !num(c.lastEncouragedAt)
    )
      throw new Error("Crescita o bonus non validi.");
    const expectedUnlock =
      def.unlock === "starter" || Number(v.activities[def.unlock.slice(4)]) > 0;
    if (
      c.unlocked !== expectedUnlock ||
      (!c.unlocked && (c.level !== 1 || c.xpInLevel !== 0))
    )
      throw new Error("Sblocco creatura incoerente.");
    if (c.assignedActivityId !== null) {
      if (
        typeof c.assignedActivityId !== "string" ||
        !c.unlocked ||
        !v.activities[c.assignedActivityId] ||
        occupied.has(c.assignedActivityId)
      )
        throw new Error("Assegnazione non valida.");
      occupied.add(c.assignedActivityId);
    }
  }
  if (
    !record(v.specialProducts) ||
    !exactKeys(
      v.specialProducts,
      activities.map((a) => a.id),
    )
  )
    throw new Error("Prodotti non validi.");
  for (const a of activities) {
    const p = v.specialProducts[a.id];
    if (
      !record(p) ||
      !num(p.secondsAccumulated) ||
      p.secondsAccumulated > b.specialProduct.secondsToReady ||
      typeof p.ready !== "boolean" ||
      p.ready !==
        p.secondsAccumulated >= b.specialProduct.secondsToReady - 1e-8 ||
      (!v.activities[a.id] && p.secondsAccumulated !== 0)
    )
      throw new Error("Maturazione prodotto non valida.");
    if (
      v.activities[a.id] &&
      a.requiresProject &&
      !v.completedProjects.includes(a.requiresProject)
    )
      throw new Error("Attività senza prerequisito.");
  }
  for (const p of projects)
    if (v.completedProjects.includes(p.id) && !v.activities[p.requiresOwned])
      throw new Error("Progetto senza attività richiesta.");
  const earned = b.milestones.filter((m) =>
    (v.claimedMilestoneIds as string[]).includes(m.id),
  );
  if (
    earned.some((m) => Number(v.lifetimeCoins) + 1e-8 < m.lifetimeCoins) ||
    b.milestones.some(
      (m) =>
        Number(v.lifetimeCoins) >= m.lifetimeCoins &&
        !(v.claimedMilestoneIds as string[]).includes(m.id),
    )
  )
    throw new Error("Premi incoerenti.");
  const expectedCrystals =
    earned.reduce((n, m) => n + m.crystals, 0) -
    projects
      .filter((p) => (v.completedProjects as string[]).includes(p.id))
      .reduce((n, p) => n + p.crystalsCost, 0);
  if (
    v.crystals !== expectedCrystals ||
    Number(v.coins) > b.startingCoins + Number(v.lifetimeCoins) + 1e-6
  )
    throw new Error("Saldo incoerente.");
  return v as unknown as SavedState;
}
export function load(
  storage: StorageLike,
  now: number,
  readOnly = false,
): {
  state: State;
  warning?: string;
  corrupt?: string;
  previous?: SavedState;
  migrationBackup?: string;
} {
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return {
      state: createState(now),
      warning: "Il salvataggio non è disponibile",
    };
  }
  if (!raw) return { state: createState(now) };
  try {
    const previous = parseSave(raw);
    return {
      state: readOnly
        ? { ...previous, economyVersion: 2 }
        : normalizeSave(previous, now),
      previous,
      migrationBackup: previous.economyVersion !== 2 ? raw : undefined,
    };
  } catch (e) {
    try {
      if (!readOnly) storage.setItem(`${SAVE_KEY}.recovery`, raw);
    } catch {
      /* Original stays in the primary slot. */
    }
    return {
      state: createState(now),
      corrupt: raw,
      warning: `Salvataggio conservato: ${(e as Error).message} Esportalo o riparti esplicitamente.`,
    };
  }
}
export function save(storage: StorageLike, state: State): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
