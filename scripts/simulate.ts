import { writeFileSync } from "node:fs";
import { activities, projects } from "../src/content";
import {
  advance,
  baseRate,
  command,
  createState,
  totalRate,
  upgradeCost,
  type State,
} from "../src/core/legacy-v1";
import { parseSave } from "../src/persistence/save";
const epoch = 1_800_000_000_000;
function simulate(active: boolean) {
  let state = createState(epoch);
  const events: { hour: number; event: string }[] = [],
    snapshots: object[] = [];
  function invest() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const action of [
        ...projects.map((p) => ({
          type: "completeProject" as const,
          id: p.id,
        })),
        ...activities
          .filter((a) => !state.activities[a.id])
          .map((a) => ({ type: "buyActivity" as const, id: a.id })),
      ]) {
        const result = command(state, action, state.lastSimulatedAt);
        if (!result.error) {
          state = result.state;
          changed = true;
          events.push({
            hour: (state.lastSimulatedAt - epoch) / 3600_000,
            event: `${action.type}:${action.id}`,
          });
        }
      }
    }
    // Invest the remaining balance by marginal passive production / cost; no auto purchases between visits.
    for (let i = 0; i < 200; i++) {
      const candidates = activities
        .filter(
          (a) =>
            state.activities[a.id] > 0 &&
            state.activities[a.id] < 50 &&
            state.coins >= upgradeCost(state, a.id),
        )
        .sort(
          (a, c) =>
            (baseRate(state, c.id, state.activities[c.id] + 1) -
              baseRate(state, c.id)) /
              upgradeCost(state, c.id) -
            (baseRate(state, a.id, state.activities[a.id] + 1) -
              baseRate(state, a.id)) /
              upgradeCost(state, a.id),
        );
      if (!candidates.length) break;
      state = command(
        state,
        { type: "upgradeActivity", id: candidates[0].id },
        state.lastSimulatedAt,
      ).state;
    }
  }
  for (const hour of [0, 1, 4, 8, 24]) {
    state = advance(state, epoch + hour * 3600_000);
    invest();
    if (active && hour < 24) {
      for (let second = 0; second < 180; second += 15) {
        state = advance(state, epoch + hour * 3600_000 + second * 1000);
        for (const [id, c] of Object.entries(state.creatures))
          if (c.unlocked && c.assignedActivityId)
            state = command(
              state,
              { type: "encourage", id },
              state.lastSimulatedAt,
            ).state;
        for (const a of activities)
          if (state.specialProducts[a.id].ready)
            state = command(
              state,
              { type: "collectProduct", id: a.id },
              state.lastSimulatedAt,
            ).state;
        state = command(
          state,
          { type: "activateFestival" },
          state.lastSimulatedAt,
        ).state;
      }
      state = advance(state, epoch + hour * 3600_000 + 180_000);
    }
    parseSave(JSON.stringify(state));
    if (!Number.isFinite(state.coins) || state.coins < 0)
      throw new Error("Economia non valida");
    snapshots.push({
      hour,
      coins: +state.coins.toFixed(3),
      lifetimeCoins: +state.lifetimeCoins.toFixed(3),
      rate: +totalRate(state).toFixed(3),
      crystals: state.crystals,
      activities: { ...state.activities },
      projects: [...state.completedProjects],
    });
  }
  return {
    policy: active ? "attiva" : "passiva",
    events,
    snapshots,
    final: {
      coins: state.coins,
      produced: state.lifetimeCoins,
      rate: totalRate(state),
      creatures: state.creatures,
      activities: state.activities,
    },
  };
}
const passive = simulate(false),
  active = simulate(true);
// Additional accessibility check: visits each minute, no carezze/festival/products,
// one initial garden upgrade, then reserve coins for the required sequence.
let essential = command(
  createState(epoch),
  { type: "upgradeActivity", id: "orto" },
  epoch,
).state;
const essentialEvents: { minute: number; event: string }[] = [];
for (
  let minute = 1;
  minute <= 120 && !essential.completedProjects.includes("festa");
  minute++
) {
  essential = advance(essential, epoch + minute * 60_000);
  for (const action of [
    { type: "buyActivity" as const, id: "vivaio" },
    { type: "completeProject" as const, id: "sentiero" },
    { type: "buyActivity" as const, id: "mulino" },
    { type: "completeProject" as const, id: "ponte" },
    { type: "buyActivity" as const, id: "laboratorio" },
    { type: "completeProject" as const, id: "festa" },
  ]) {
    const result = command(essential, action, essential.lastSimulatedAt);
    if (!result.error) {
      essential = result.state;
      essentialEvents.push({ minute, event: `${action.type}:${action.id}` });
    }
  }
}
if (!essential.completedProjects.includes("festa"))
  throw new Error("Percorso essenziale bloccato");
const result = {
  generatedAt: new Date().toISOString(),
  checkinsHours: [0, 1, 4, 8, 24],
  activeWindowSeconds: 180,
  activeInputEverySeconds: 15,
  policy:
    "Ai check-in: prima progetti e nuove attività finché possibili; poi upgrade per rendimento marginale/costo. Politica attiva aggiunge carezze, raccolte e meraviglie per 3 min a 0/1/4/8h; nessun input tra le finestre. Snapshot 24h dopo investimenti, senza finestra successiva.",
  passive,
  active,
  essentialPath: {
    policy:
      "Check-in ogni minuto; upgrade orto iniziale, poi risparmio per la sequenza essenziale. Nessun bonus attivo o raccolta.",
    events: essentialEvents,
  },
  difference: {
    produced: active.final.produced - passive.final.produced,
    percent: (active.final.produced / passive.final.produced - 1) * 100,
  },
};
writeFileSync(
  "docs/simulation-results.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
