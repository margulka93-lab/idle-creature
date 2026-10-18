import {
  activities,
  balance as b,
  creatures,
  projects,
  flow,
  projectRequirements,
  purchaseModes,
  type PurchaseMode,
} from "../content";

export interface CreatureState {
  unlocked: boolean;
  level: number;
  xpInLevel: number;
  assignedActivityId: string | null;
  encouragedUntil: number;
  lastEncouragedAt: number;
}
export interface State {
  schemaVersion: 1;
  economyVersion: 2;
  coins: number;
  lifetimeCoins: number;
  crystals: number;
  activities: Record<string, number>;
  creatures: Record<string, CreatureState>;
  completedProjects: string[];
  claimedMilestoneIds: string[];
  specialProducts: Record<
    string,
    { secondsAccumulated: number; ready: boolean }
  >;
  festivalEndsAt: number;
  festivalReadyAt: number;
  lastSimulatedAt: number;
}
export type Command =
  | { type: "buyActivity"; id: string }
  | { type: "collectProduct"; id: string }
  | { type: "upgradeActivity"; id: string; mode?: PurchaseMode }
  | { type: "encourage"; id: string }
  | { type: "assignCreature"; id: string; activityId: string | null }
  | { type: "completeProject"; id: string }
  | { type: "activateFestival" };
export const clone = (s: State): State => structuredClone(s);
export function createState(now: number): State {
  const s: State = {
    schemaVersion: 1,
    economyVersion: 2,
    coins: b.startingCoins,
    lifetimeCoins: 0,
    crystals: 0,
    activities: Object.fromEntries(activities.map((a) => [a.id, a.startLevel])),
    creatures: Object.fromEntries(
      creatures.map((c) => [
        c.id,
        {
          unlocked: c.unlock === "starter",
          level: 1,
          xpInLevel: 0,
          assignedActivityId:
            c.unlock === "starter" ? c.preferredActivity : null,
          encouragedUntil: 0,
          lastEncouragedAt: 0,
        },
      ]),
    ),
    completedProjects: [],
    claimedMilestoneIds: [],
    specialProducts: Object.fromEntries(
      activities.map((a) => [a.id, { secondsAccumulated: 0, ready: false }]),
    ),
    festivalEndsAt: 0,
    festivalReadyAt: 0,
    lastSimulatedAt: now,
  };
  return s;
}
export const assigned = (s: State, id: string) =>
  Object.entries(s.creatures).find(
    ([, c]) => c.unlocked && c.assignedActivityId === id,
  );
export const milestoneFactor = (level: number) =>
  flow.activityMilestones
    .filter((m) => level >= m.level)
    .reduce((factor, m) => factor * m.factor, 1);
export const nextActivityMilestone = (level: number) =>
  flow.activityMilestones.find((m) => m.level > level);
export const encouragementDuration = (level: number) =>
  flow.creatureMilestones.reduce(
    (duration, m) =>
      level >= m.level && m.encouragementDurationSeconds
        ? m.encouragementDurationSeconds
        : duration,
    b.pet.durationSeconds,
  );
export const preferredTalentBonus = (level: number) =>
  flow.creatureMilestones.reduce(
    (bonus, m) =>
      bonus + (level >= m.level ? (m.preferredAssignmentBonusAdd ?? 0) : 0),
    0,
  );
export const nextCreatureMilestone = (level: number) =>
  flow.creatureMilestones.find((m) => m.level > level);
export const baseRate = (
  s: State,
  id: string,
  level = s.activities[id],
): number => {
  const a = activities.find((a) => a.id === id);
  if (!a || level < 1) return 0;
  const worker = assigned(s, id);
  const bonus = worker
    ? b.creature.assignedBonus +
      b.creature.bonusPerLevel * (worker[1].level - 1) +
      (creatures.find((c) => c.id === worker[0])!.preferredActivity === id
        ? b.creature.preferredBonus + preferredTalentBonus(worker[1].level)
        : 0)
    : 0;
  return (
    (a.baseCoinsPerSecond + (level - 1) * a.coinsPerSecondPerLevel) *
    (1 + bonus) *
    milestoneFactor(level)
  );
};
export function rate(
  s: State,
  id: string,
  at = s.lastSimulatedAt,
  level = s.activities[id],
): number {
  const worker = assigned(s, id);
  return (
    baseRate(s, id, level) *
    (1 +
      (worker && worker[1].encouragedUntil > at
        ? b.pet.additiveProductionBonus
        : 0) +
      (s.festivalEndsAt > at ? b.festival.additiveProductionBonus : 0))
  );
}
export const totalRate = (s: State) =>
  activities.reduce((n, a) => n + rate(s, a.id), 0);
export const upgradeCost = (s: State, id: string) => {
  const a = activities.find((a) => a.id === id)!;
  return Math.ceil(
    a.upgradeBaseCost * a.upgradeCostGrowth ** (s.activities[id] - 1),
  );
};
export interface UpgradeQuote {
  from: number;
  target: number;
  count: number;
  cost: number;
  affordable: boolean;
  beforeRate: number;
  afterRate: number;
  milestones: { level: number; factor: number }[];
}
export function quoteUpgrade(
  s: State,
  id: string,
  mode: PurchaseMode = "1",
): UpgradeQuote {
  const a = activities.find((a) => a.id === id),
    from = s.activities[id] ?? 0;
  let target = from,
    cost = 0;
  if (
    a &&
    from > 0 &&
    from < b.activityMaxLevel &&
    purchaseModes.includes(mode)
  ) {
    const desired =
      mode === "1"
        ? from + 1
        : mode === "10"
          ? Math.min(from + 10, b.activityMaxLevel)
          : mode === "next"
            ? (nextActivityMilestone(from)?.level ?? from)
            : b.activityMaxLevel;
    for (let level = from; level < desired; level++) {
      const price = Math.ceil(
        a.upgradeBaseCost * a.upgradeCostGrowth ** (level - 1),
      );
      if (mode === "max" && cost + price > s.coins) break;
      cost += price;
      target = level + 1;
    }
  }
  return {
    from,
    target,
    count: target - from,
    cost,
    affordable: target > from && cost <= s.coins,
    beforeRate: baseRate(s, id),
    afterRate: baseRate(s, id, target),
    milestones: flow.activityMilestones.filter(
      (m) => m.level > from && m.level <= target,
    ),
  };
}
export function projectChecklist(s: State, id: string) {
  const p = projects.find((p) => p.id === id);
  if (!p) return [];
  const checks: { label: string; met: boolean }[] = [];
  if (p.requiresProject)
    checks.push({
      label: projects.find((x) => x.id === p.requiresProject)!.name,
      met: s.completedProjects.includes(p.requiresProject),
    });
  checks.push({
    label: `${activities.find((a) => a.id === p.requiresOwned)!.name} costruito`,
    met: s.activities[p.requiresOwned] > 0,
  });
  for (const [activityId, level] of Object.entries(
    projectRequirements[id]?.activityLevels ?? {},
  ))
    checks.push({
      label: `${activities.find((a) => a.id === activityId)!.name} L${level}`,
      met: s.activities[activityId] >= level,
    });
  for (const [creatureId, level] of Object.entries(
    projectRequirements[id]?.creatureLevels ?? {},
  ))
    checks.push({
      label: `${creatures.find((c) => c.id === creatureId)!.name} L${level}`,
      met:
        s.creatures[creatureId].unlocked &&
        s.creatures[creatureId].level >= level,
    });
  return checks;
}
export const villageLevel = (s: State) => 1 + s.completedProjects.length;
function rewards(s: State) {
  for (const m of b.milestones)
    if (
      s.lifetimeCoins + 1e-8 >= m.lifetimeCoins &&
      !s.claimedMilestoneIds.includes(m.id)
    ) {
      s.claimedMilestoneIds.push(m.id);
      s.crystals += m.crystals;
    }
  for (const def of creatures) {
    const c = s.creatures[def.id];
    if (
      !c.unlocked &&
      def.unlock.startsWith("own:") &&
      s.activities[def.unlock.slice(4)] > 0
    ) {
      c.unlocked = true;
      if (!assigned(s, def.preferredActivity))
        c.assignedActivityId = def.preferredActivity;
    }
  }
}
/** Event integration: at most growth/boost boundaries, never one step per second. */
export function advance(input: State, toTime: number): State {
  const s = clone(input);
  if (!Number.isFinite(toTime) || toTime <= s.lastSimulatedAt) return s;
  let t = s.lastSimulatedAt;
  const end = Math.min(toTime, t + b.offlineCapSeconds * 1000);
  while (t < end) {
    let next = end;
    if (s.festivalEndsAt > t) next = Math.min(next, s.festivalEndsAt);
    for (const c of Object.values(s.creatures)) {
      if (!c.unlocked || !c.assignedActivityId) continue;
      if (c.encouragedUntil > t) next = Math.min(next, c.encouragedUntil);
      if (c.level < b.creatureMaxLevel)
        next = Math.min(
          next,
          t +
            ((b.creature.xpToNextLevelBase * c.level - c.xpInLevel) /
              b.creature.xpPerWorkingSecond) *
              1000,
        );
    }
    const seconds = (next - t) / 1000;
    let earned = 0;
    for (const a of activities) {
      earned += rate(s, a.id, t) * seconds;
      if (s.activities[a.id] > 0) {
        const product = s.specialProducts[a.id];
        if (!product.ready) {
          product.secondsAccumulated = Math.min(
            b.specialProduct.secondsToReady,
            product.secondsAccumulated + seconds,
          );
          product.ready =
            product.secondsAccumulated >=
            b.specialProduct.secondsToReady - 1e-8;
        }
      }
    }
    s.coins += earned;
    s.lifetimeCoins += earned;
    for (const c of Object.values(s.creatures))
      if (c.unlocked && c.assignedActivityId && c.level < b.creatureMaxLevel) {
        c.xpInLevel += seconds * b.creature.xpPerWorkingSecond;
        while (
          c.level < b.creatureMaxLevel &&
          c.xpInLevel + 1e-7 >= b.creature.xpToNextLevelBase * c.level
        ) {
          c.xpInLevel = Math.max(
            0,
            c.xpInLevel - b.creature.xpToNextLevelBase * c.level,
          );
          c.level++;
        }
        if (c.level === b.creatureMaxLevel) c.xpInLevel = 0;
      }
    rewards(s);
    t = next;
  }
  s.lastSimulatedAt = toTime;
  return s;
}
export function command(
  input: State,
  action: Command,
  now: number,
): { state: State; error?: string } {
  const s = advance(input, now);
  const fail = (error: string) => ({ state: s, error });
  if (action.type === "activateFestival") {
    if (!s.completedProjects.includes(b.festival.requiresProject))
      return fail("Completa prima il Sentiero.");
    if (s.festivalReadyAt > s.lastSimulatedAt)
      return fail("Le meraviglie si stanno ricaricando.");
    s.festivalEndsAt = s.lastSimulatedAt + b.festival.durationSeconds * 1000;
    s.festivalReadyAt = s.lastSimulatedAt + b.festival.cooldownSeconds * 1000;
  } else if (action.type === "encourage" || action.type === "assignCreature") {
    const c = s.creatures[action.id];
    if (!c?.unlocked) return fail("Creatura non ancora disponibile.");
    if (action.type === "encourage") {
      if (!c.assignedActivityId)
        return fail("Assegna prima la creatura a un’attività.");
      if (
        c.encouragedUntil > 0 &&
        s.lastSimulatedAt - c.lastEncouragedAt <
          b.pet.refreshThrottleMilliseconds
      )
        return fail("Carezza già ricevuta.");
      c.lastEncouragedAt = s.lastSimulatedAt;
      c.encouragedUntil =
        s.lastSimulatedAt + encouragementDuration(c.level) * 1000;
    } else {
      if (
        action.activityId !== null &&
        (!s.activities[action.activityId] ||
          (assigned(s, action.activityId)?.[0] &&
            assigned(s, action.activityId)?.[0] !== action.id))
      )
        return fail("Attività non acquistata o già occupata.");
      c.assignedActivityId = action.activityId;
    }
  } else if (action.type === "completeProject") {
    const p = projects.find((p) => p.id === action.id);
    if (!p || s.completedProjects.includes(p.id))
      return fail("Progetto non disponibile.");
    if (projectChecklist(s, p.id).some((check) => !check.met))
      return fail("Completa i prerequisiti del progetto.");
    if (s.coins < p.coinsCost || s.crystals < p.crystalsCost)
      return fail("Monete o cristalli insufficienti.");
    s.coins -= p.coinsCost;
    s.crystals -= p.crystalsCost;
    s.completedProjects.push(p.id);
  } else {
    const a = activities.find((a) => a.id === action.id);
    if (!a) return fail("Attività sconosciuta.");
    if (action.type === "collectProduct") {
      if (!s.activities[a.id] || !s.specialProducts[a.id].ready)
        return fail("Il prodotto non è pronto.");
      const earned =
        baseRate(s, a.id) * b.specialProduct.rewardUnboostedProductionSeconds;
      s.coins += earned;
      s.lifetimeCoins += earned;
      s.specialProducts[a.id] = { ready: false, secondsAccumulated: 0 };
    } else if (action.type === "buyActivity") {
      if (s.activities[a.id] > 0) return fail("Attività già acquistata.");
      if (a.requiresProject && !s.completedProjects.includes(a.requiresProject))
        return fail("Completa prima il progetto richiesto.");
      if (s.coins < a.purchaseCost) return fail("Monete insufficienti.");
      s.coins -= a.purchaseCost;
      s.activities[a.id] = 1;
    } else {
      if (s.activities[a.id] < 1 || s.activities[a.id] >= b.activityMaxLevel)
        return fail("Attività non migliorabile.");
      const quote = quoteUpgrade(s, a.id, action.mode ?? "1");
      if (!quote.affordable)
        return fail("Monete insufficienti per questo acquisto.");
      s.coins -= quote.cost;
      s.activities[a.id] = quote.target;
    }
  }
  rewards(s);
  return { state: s };
}
export function returnSummary(
  before: Omit<State, "economyVersion">,
  after: State,
) {
  const elapsed = Math.max(
    0,
    (after.lastSimulatedAt - before.lastSimulatedAt) / 1000,
  );
  return {
    elapsed,
    counted: Math.min(elapsed, b.offlineCapSeconds),
    capped: elapsed > b.offlineCapSeconds,
    earned: after.lifetimeCoins - before.lifetimeCoins,
    talents: creatures.flatMap((def) =>
      flow.creatureMilestones
        .filter(
          (m) =>
            m.level > before.creatures[def.id].level &&
            m.level <= after.creatures[def.id].level,
        )
        .map(
          (m) =>
            `${def.name} L${m.level}: ${m.preferredAssignmentBonusAdd ? "talento preferita +10%" : `carezze ${m.encouragementDurationSeconds}s`}`,
        ),
    ),
    crystals: after.crystals - before.crystals,
    levels: Object.entries(after.creatures).reduce(
      (n, [id, c]) => n + c.level - before.creatures[id].level,
      0,
    ),
  };
}
