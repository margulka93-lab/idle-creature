import { writeFileSync } from "node:fs";
import * as v1 from "../src/core/legacy-v1";
import * as v2 from "../src/core/engine";
import { activities, projects, creatures } from "../src/content";
import { parseSave } from "../src/persistence/save";
const epoch = 1_800_000_000_000,
  minute = 60_000;
type Policy = "marginale" | "obiettivi";
type SimState = v2.State;
function simulate(version: 1 | 2, policy: Policy, active: boolean) {
  const engine = version === 1 ? v1 : v2;
  let state = engine.createState(epoch) as SimState;
  let purchases = 0,
    upgradeCommands = 0,
    selections = 0,
    selected: string | null = version === 1 ? "orto" : null,
    bonusInputs = 0;
  let firstL10: number | null = null,
    secondResident: number | null = null,
    completion: number | null = null,
    capAt: number | null = null;
  const events: { minute: number; event: string }[] = [],
    snapshots: object[] = [],
    purchaseMinutes: number[] = [];
  const record = (event: string, at = state.lastSimulatedAt) =>
    events.push({ minute: (at - epoch) / minute, event });
  const execute = (action: v2.Command, economic = true) => {
    const before = state;
    const result = engine.command(state, action, state.lastSimulatedAt);
    if (result.error) return false;
    state = result.state as SimState;
    if (economic) {
      purchases++;
      purchaseMinutes.push((state.lastSimulatedAt - epoch) / minute);
      if (
        version === 1 &&
        (action.type === "upgradeActivity" || action.type === "buyActivity") &&
        selected !== action.id
      ) {
        selections++;
        selected = action.id;
      }
      if (action.type === "upgradeActivity") {
        upgradeCommands++;
        record(
          `upgrade:${action.id}:${before.activities[action.id]}→${state.activities[action.id]}`,
        );
        for (const level of [10, 25, 50])
          if (
            before.activities[action.id] < level &&
            state.activities[action.id] >= level
          ) {
            record(`soglia:${action.id}:L${level}`);
            if (level === 10 && firstL10 === null)
              firstL10 = (state.lastSimulatedAt - epoch) / minute;
          }
      } else record(`${action.type}:${"id" in action ? action.id : ""}`);
      if (!before.creatures.nibi.unlocked && state.creatures.nibi.unlocked)
        secondResident = (state.lastSimulatedAt - epoch) / minute;
      if (
        !before.completedProjects.includes("festa") &&
        state.completedProjects.includes("festa")
      )
        completion = (state.lastSimulatedAt - epoch) / minute;
      if (
        capAt === null &&
        activities.every((a) => state.activities[a.id] === 50)
      )
        capAt = (state.lastSimulatedAt - epoch) / minute;
    } else bonusInputs++;
    return true;
  };
  function buyLevels(id: string, target: number, max = false) {
    const from = state.activities[id],
      a = activities.find((a) => a.id === id)!;
    let cost = 0,
      affordableTarget = from;
    for (let l = from; l < target; l++) {
      const price = Math.ceil(
        a.upgradeBaseCost * a.upgradeCostGrowth ** (l - 1),
      );
      if (cost + price > state.coins && max) break;
      cost += price;
      affordableTarget = l + 1;
    }
    if (cost > state.coins || affordableTarget <= from) return false;
    if (version === 1) {
      for (let l = from; l < affordableTarget; l++)
        execute({ type: "upgradeActivity", id });
      return true;
    }
    return execute({
      type: "upgradeActivity",
      id,
      mode: max ? "max" : target === from + 1 ? "1" : "next",
    });
  }
  function essentials() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of projects)
        if (execute({ type: "completeProject", id: p.id })) changed = true;
      for (const a of activities)
        if (
          !state.activities[a.id] &&
          execute({ type: "buyActivity", id: a.id })
        )
          changed = true;
    }
  }
  function invest() {
    essentials();
    if (state.lastSimulatedAt === epoch) {
      buyLevels("orto", 2);
      return;
    }
    if (policy === "marginale") {
      for (let i = 0; i < 196; i++) {
        const list = activities
          .filter(
            (a) =>
              state.activities[a.id] > 0 &&
              state.activities[a.id] < 50 &&
              state.coins >= engine.upgradeCost(state, a.id),
          )
          .sort(
            (a, c) =>
              (engine.baseRate(state, c.id, state.activities[c.id] + 1) -
                engine.baseRate(state, c.id)) /
                engine.upgradeCost(state, c.id) -
              (engine.baseRate(state, a.id, state.activities[a.id] + 1) -
                engine.baseRate(state, a.id)) /
                engine.upgradeCost(state, a.id),
          );
        if (!list.length) break;
        buyLevels(list[0].id, state.activities[list[0].id] + 1);
        essentials();
      }
    } else {
      for (let cycle = 0; cycle < 20; cycle++) {
        const nextProject = projects.find(
          (p) => !state.completedProjects.includes(p.id),
        );
        const target = nextProject?.id === "festa" ? 25 : nextProject ? 10 : 50;
        const candidates = activities.filter(
          (a) => state.activities[a.id] > 0 && state.activities[a.id] < target,
        );
        // Reserve for the next threshold, then expand. Never degrade a NEXT quote to +1.
        const a = candidates[0];
        if (!a) break;
        const next = [10, 25, 50].find((l) => l > state.activities[a.id])!;
        if (!buyLevels(a.id, Math.min(next, target), !nextProject)) break;
        essentials();
      }
    }
    parseSave(JSON.stringify(state));
  }
  const visits = new Set([
    ...Array.from({ length: 31 }, (_, i) => i),
    60,
    240,
    480,
    1440,
  ]);
  const windows = [0, 5, 15, 30, 60, 240, 480];
  for (let seconds = 0; seconds <= 86400; seconds += 15) {
    const scheduledVisit = seconds % 60 === 0 && visits.has(seconds / 60);
    const activeWindow =
      active &&
      windows.some((w) => seconds >= w * 60 && seconds < w * 60 + 180);
    // No hidden ticks during an absence: jump directly to the next visit/input.
    if (!scheduledVisit && !activeWindow) continue;
    const now = epoch + seconds * 1000,
      before = state;
    state = engine.advance(state, now) as SimState;
    for (const def of creatures)
      for (const level of [5, 10, 20])
        if (
          before.creatures[def.id].level < level &&
          state.creatures[def.id].level >= level
        ) {
          const c = before.creatures[def.id];
          let needed = -c.xpInLevel;
          for (let l = c.level; l < level; l++) needed += 50 * l;
          record(
            `talento:${def.id}:L${level}`,
            before.lastSimulatedAt + needed * 1000,
          );
        }
    if (scheduledVisit) invest();
    if (activeWindow) {
      for (const [id, c] of Object.entries(state.creatures))
        if (c.unlocked && c.assignedActivityId)
          execute({ type: "encourage", id }, false);
      for (const a of activities)
        if (state.specialProducts[a.id].ready)
          execute({ type: "collectProduct", id: a.id }, false);
      execute({ type: "activateFestival" }, false);
    }
    if ([300, 900, 1800, 3600, 86400].includes(seconds))
      snapshots.push({
        minute: seconds / 60,
        coins: state.coins,
        produced: state.lifetimeCoins,
        passiveRate: activities.reduce(
          (n, a) => n + engine.baseRate(state, a.id),
          0,
        ),
        activities: { ...state.activities },
        projects: [...state.completedProjects],
        purchases,
        upgradeCommands,
        selections,
        bonusInputs,
      });
    if (!Number.isFinite(state.coins) || state.coins < 0)
      throw new Error("Economia non valida");
  }
  parseSave(JSON.stringify(state));
  const gaps = purchaseMinutes
    .filter((m) => m <= 30)
    .map((m, i, all) => m - (all[i - 1] ?? 0));
  gaps.push(30 - (purchaseMinutes.filter((m) => m <= 30).at(-1) ?? 0));
  const objectiveSnapshots = snapshots.map((snapshot) => {
    const s = snapshot as {
      minute: number;
      activities: Record<string, number>;
      projects: string[];
    };
    const nextProject = projects.find((p) => !s.projects.includes(p.id));
    const activity = activities.find((a) => s.activities[a.id] < 50);
    const objective = nextProject
      ? `completeProject:${nextProject.id}`
      : activity
        ? `soglia:${activity.id}:L50`
        : null;
    const at = objective
      ? (events.find((e) => e.event === objective && e.minute >= s.minute)
          ?.minute ?? null)
      : null;
    return {
      ...s,
      nextObjective: objective,
      nextObjectiveAtMinute: at,
      waitForNextObjectiveMinutes: at === null ? null : at - s.minute,
    };
  });
  return {
    version,
    policy,
    active,
    firstL10Minute: firstL10,
    secondResidentMinute: secondResident,
    completionMinute: completion,
    capAtMinute: capAt,
    purchases,
    upgradeCommands,
    selectionActions: selections,
    economicUIActions: purchases + selections,
    bonusInputs,
    longestNoPurchaseGapFirst30Minutes: Math.max(...gaps),
    snapshots: objectiveSnapshots,
    events,
  };
}
const runs = ([1, 2] as const).flatMap((version) =>
  (["marginale", "obiettivi"] as const).flatMap((policy) =>
    [false, true].map((active) => simulate(version, policy, active)),
  ),
);
const contrasts = (["marginale", "obiettivi"] as const).flatMap((policy) =>
  [1, 2].map((version) => {
    const passive = runs.find(
      (r) => r.version === version && r.policy === policy && !r.active,
    )!;
    const active = runs.find(
      (r) => r.version === version && r.policy === policy && r.active,
    )!;
    return {
      version,
      policy,
      windows: passive.snapshots.map((p, index) => {
        const a = active.snapshots[index] as unknown as {
            minute: number;
            produced: number;
          },
          old = p as unknown as { minute: number; produced: number };
        const prevP = index
          ? (passive.snapshots[index - 1] as unknown as { produced: number })
              .produced
          : 0;
        const prevA = index
          ? (active.snapshots[index - 1] as unknown as { produced: number })
              .produced
          : 0;
        return {
          fromMinute: index ? passive.snapshots[index - 1].minute : 0,
          minute: a.minute,
          earnedPassive: old.produced - prevP,
          earnedActive: a.produced - prevA,
          intervalProducedPercent:
            ((a.produced - prevA) / (old.produced - prevP) - 1) * 100,
          producedPercent: (a.produced / old.produced - 1) * 100,
        };
      }),
    };
  }),
);
const result = {
  baselineCommit: "8ae73a6",
  generatedAt: new Date().toISOString(),
  policy:
    "Visite ogni minuto da 0 a 30min, poi 1h/4h/8h/24h; upgrade iniziale +1. Progetti e costruzioni prima degli upgrade e dopo ogni investimento. Marginale: +1 per rendimento/costo. Obiettivi: risparmio per soglie 10/25, poi MAX verso50. V1 esegue ciascun livello singolarmente; v2 un comando per blocco. Stesse visite e decisioni per entrambe le versioni; la variante attiva aggiunge bonus ogni15s in finestre di3min a0/5/15/30/60/240/480min. Nessun acquisto tra le visite. Gap senza acquisti descrive questa politica, non incapacità tecnica di investire.",
  clickBurden: [
    {
      scenario: "Orto L1→10, fondi esatti",
      v1UpgradeClicks: 9,
      v2UpgradeClicks: 1,
    },
    {
      scenario: "Orto L8→10, 153 monete",
      v1UpgradeClicks: 2,
      v2UpgradeClicks: 1,
    },
    {
      scenario: "Ritorno, quattro attività L1 con fondi per cap",
      v1UpgradeClicks: 196,
      v2UpgradeClicks: 4,
    },
  ],
  runs,
  contrasts,
};
writeFileSync(
  "docs/flow-simulation-results.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.table(runs.map(({ events, snapshots, ...metrics }) => metrics));
console.log(JSON.stringify(contrasts, null, 2));
