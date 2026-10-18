import { describe, expect, it } from "vitest";
import { activities, flow, projectRequirements } from "../src/content";
import {
  advance,
  baseRate,
  command,
  createState,
  encouragementDuration,
  milestoneFactor,
  quoteUpgrade,
  projectChecklist,
  type State,
} from "../src/core/engine";
import * as legacy from "../src/core/legacy-v1";
import { normalizeSave, parseSave } from "../src/persistence/save";
const epoch = 1_800_000_000_000;
function funded(level = 1, coins = 10_000_000) {
  const s = createState(epoch);
  s.activities.orto = level;
  s.coins = coins;
  return s;
}
describe("F02 quote ed acquisti atomici", () => {
  it("esempio indipendente L8→10 = 153 e 3.835→9.49 senza boost", () => {
    const s = funded(8, 153),
      q = quoteUpgrade(s, "orto", "next");
    expect(q).toMatchObject({
      from: 8,
      target: 10,
      count: 2,
      cost: 153,
      affordable: true,
    });
    expect(q.beforeRate).toBeCloseTo(3.835);
    expect(q.afterRate).toBeCloseTo(9.49);
    const result = command(
      s,
      { type: "upgradeActivity", id: "orto", mode: "next" },
      epoch,
    );
    expect(result.error).toBeUndefined();
    expect(result.state.coins).toBe(0);
    expect(result.state.activities.orto).toBe(10);
    expect(result.state.creatures).toEqual(s.creatures);
    expect(result.state.lastSimulatedAt).toBe(epoch);
  });
  it("somma ceil individuali, nessun blocco parziale +10 per fondi insufficienti", () => {
    const s = funded(1);
    const q = quoteUpgrade(s, "orto", "10");
    expect(q.cost).toBe(
      Array.from({ length: 10 }, (_, i) => Math.ceil(25 * 1.16 ** i)).reduce(
        (a, c) => a + c,
        0,
      ),
    );
    s.coins = q.cost - 1;
    expect(quoteUpgrade(s, "orto", "10").affordable).toBe(false);
    expect(
      command(s, { type: "upgradeActivity", id: "orto", mode: "10" }, epoch)
        .state,
    ).toEqual(s);
    s.coins++;
    expect(
      command(s, { type: "upgradeActivity", id: "orto", mode: "10" }, epoch)
        .state.activities.orto,
    ).toBe(11);
  });
  it("MAX massimale, zero fondi e cap con ultimo blocco parziale", () => {
    const s = funded(1, 200);
    const q = quoteUpgrade(s, "orto", "max");
    expect(q.target).toBeGreaterThan(1);
    const after = command(
      s,
      { type: "upgradeActivity", id: "orto", mode: "max" },
      epoch,
    ).state;
    expect(quoteUpgrade(after, "orto", "1").affordable).toBe(false);
    expect(after.coins).toBe(200 - q.cost);
    s.coins = 0;
    expect(quoteUpgrade(s, "orto", "max")).toMatchObject({
      count: 0,
      cost: 0,
      affordable: false,
    });
    expect(
      command(s, { type: "upgradeActivity", id: "orto", mode: "max" }, epoch)
        .state,
    ).toEqual(s);
    expect(quoteUpgrade(funded(47), "orto", "10")).toMatchObject({
      target: 50,
      count: 3,
    });
    for (const mode of ["1", "10", "next", "max"] as const)
      expect(quoteUpgrade(funded(50), "orto", mode)).toMatchObject({
        count: 0,
        cost: 0,
        affordable: false,
      });
  });
  it("PROSSIMO non supera la soglia e rate passivi ignorano i boost", () => {
    for (const [level, target] of [
      [1, 10],
      [9, 10],
      [10, 25],
      [24, 25],
      [25, 50],
      [49, 50],
    ])
      expect(quoteUpgrade(funded(level), "orto", "next").target).toBe(target);
    const s = funded(8),
      before = quoteUpgrade(s, "orto", "next");
    s.creatures.momo.encouragedUntil = epoch + 30_000;
    s.festivalEndsAt = epoch + 20_000;
    expect(quoteUpgrade(s, "orto", "next")).toEqual(before);
  });
  it("bulk equivale alla sequenza singola e attraversa tutte le soglie una volta", () => {
    const s = funded();
    let singles = s;
    for (let i = 1; i < 50; i++)
      singles = command(
        singles,
        { type: "upgradeActivity", id: "orto" },
        epoch,
      ).state;
    const q = quoteUpgrade(s, "orto", "max");
    expect(q.milestones.map((m) => m.level)).toEqual([10, 25, 50]);
    const bulk = command(
      s,
      { type: "upgradeActivity", id: "orto", mode: "max" },
      epoch,
    ).state;
    expect(bulk).toEqual(singles);
    expect(
      command(bulk, { type: "upgradeActivity", id: "orto", mode: "max" }, epoch)
        .state,
    ).toEqual(bulk);
  });
  it("riquota sullo stato riconciliato invece di usare una vecchia quote", () => {
    const s = funded(1, 0);
    expect(quoteUpgrade(s, "orto", "max").count).toBe(0);
    const result = command(
      s,
      { type: "upgradeActivity", id: "orto", mode: "max" },
      epoch + 60_000,
    );
    expect(result.error).toBeUndefined();
    expect(result.state.activities.orto).toBeGreaterThan(1);
    expect(result.state.creatures.momo.level).toBe(2);
  });
  it("attività da costruire mai riceve upgrade nascosti", () => {
    const s = funded();
    expect(quoteUpgrade(s, "vivaio", "max").count).toBe(0);
    const a = command(s, { type: "buyActivity", id: "vivaio" }, epoch).state;
    expect(a.activities.vivaio).toBe(1);
    expect(a.coins).toBe(s.coins - 150);
  });
});
describe("F02 progressione e talenti", () => {
  it("fattori derivati ai bordi 9/10,24/25,49/50 e reload idempotente", () => {
    expect([9, 10, 24, 25, 49, 50].map(milestoneFactor)).toEqual([
      1, 2, 2, 4, 4, 8,
    ]);
    const s = funded(50, 0);
    expect(baseRate(s, "orto")).toBeCloseTo((0.5 + 49 * 0.35) * 1.3 * 8);
    expect(advance(s, epoch)).toEqual(s);
    expect(baseRate(advance(s, epoch), "orto")).toBe(baseRate(s, "orto"));
  });
  it("L5 bonus solo nella preferita, durata L10/L20 solo per carezze future", () => {
    const s = funded();
    s.creatures.momo.level = 5;
    expect(baseRate(s, "orto")).toBeCloseTo(0.5 * (1 + 0.1 + 0.08 + 0.2 + 0.1));
    s.creatures.momo.level = 4;
    const pet = command(s, { type: "encourage", id: "momo" }, epoch).state;
    pet.creatures.momo.level = 10;
    expect(advance(pet, epoch + 1000).creatures.momo.encouragedUntil).toBe(
      epoch + 30_000,
    );
    expect(
      command(pet, { type: "encourage", id: "momo" }, epoch + 1000).state
        .creatures.momo.encouragedUntil,
    ).toBe(epoch + 46_000);
    expect([1, 5, 9, 10, 19, 20].map(encouragementDuration)).toEqual([
      30, 30, 30, 45, 45, 60,
    ]);
    s.activities.vivaio = 1;
    s.creatures.momo.assignedActivityId = "vivaio";
    s.creatures.momo.level = 5;
    expect(baseRate(s, "vivaio")).toBeCloseTo(0.8 * 1.18);
  });
  it("attraversa soglie creature offline come online e non estende il boost residuo", () => {
    let s = command(
      funded(10, 0),
      { type: "encourage", id: "momo" },
      epoch,
    ).state;
    const offline = advance(s, epoch + 10_000_000);
    for (let i = 100_000; i <= 10_000_000; i += 100_000)
      s = advance(s, epoch + i);
    expect(s.coins).toBeCloseTo(offline.coins, 6);
    expect(s.creatures).toEqual(offline.creatures);
    expect(offline.creatures.momo.encouragedUntil).toBe(epoch + 30_000);
  });
  it("progetti nuovi applicano tutte le checklist e spese una volta sola", () => {
    let s = advance(createState(epoch), epoch + 172800_000);
    s = command(
      s,
      { type: "buyActivity", id: "vivaio" },
      s.lastSimulatedAt,
    ).state;
    expect(
      command(s, { type: "completeProject", id: "sentiero" }, s.lastSimulatedAt)
        .error,
    ).toBeTruthy();
    for (const p of ["sentiero", "ponte", "festa"]) {
      const req = projectRequirements[p];
      if (p === "ponte")
        s = command(
          s,
          { type: "buyActivity", id: "mulino" },
          s.lastSimulatedAt,
        ).state;
      if (p === "festa")
        s = command(
          s,
          { type: "buyActivity", id: "laboratorio" },
          s.lastSimulatedAt,
        ).state;
      // Real production funds purchases; no direct currency grant.
      s = advance(s, s.lastSimulatedAt + 3600_000);
      for (const [id, level] of Object.entries(req.activityLevels ?? {}))
        while (s.activities[id] < level)
          s = command(
            s,
            { type: "upgradeActivity", id, mode: "next" },
            s.lastSimulatedAt,
          ).state;
      expect(projectChecklist(s, p).every((c) => c.met)).toBe(true);
      const result = command(
        s,
        { type: "completeProject", id: p },
        s.lastSimulatedAt,
      );
      expect(result.error).toBeUndefined();
      s = result.state;
    }
    expect(s.completedProjects).toHaveLength(3);
    expect(s.crystals).toBe(5);
  });
});
describe("migrazione v1 prima dei moltiplicatori", () => {
  it("riconcilia assenza con codice v1 e preserva soldi, XP, progetti e scadenze", () => {
    let old = legacy.advance(legacy.createState(epoch), epoch + 3600_000);
    old.activities.orto = 25;
    const expected = legacy.advance(old, old.lastSimulatedAt + 3600_000);
    const migrated = normalizeSave(
      parseSave(JSON.stringify(old)),
      expected.lastSimulatedAt,
    );
    expect(migrated).toEqual({ ...expected, economyVersion: 2 });
    expect(advance(migrated, migrated.lastSimulatedAt)).toEqual(migrated);
    expect(
      advance(migrated, migrated.lastSimulatedAt + 1000).coins - migrated.coins,
    ).toBeCloseTo(baseRate(migrated, "orto"));
    expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
  });
  it("vecchi progetti completati sotto i nuovi gate restano completati", () => {
    let old = legacy.advance(legacy.createState(epoch), epoch + 86400_000);
    for (const a of activities.slice(1)) {
      old = legacy.command(
        old,
        { type: "buyActivity", id: a.id },
        old.lastSimulatedAt,
      ).state;
      for (const p of ["sentiero", "ponte", "festa"])
        old = legacy.command(
          old,
          { type: "completeProject", id: p },
          old.lastSimulatedAt,
        ).state;
    }
    const migrated = normalizeSave(
      parseSave(JSON.stringify(old)),
      old.lastSimulatedAt,
    );
    expect(migrated.completedProjects).toEqual(["sentiero", "ponte", "festa"]);
    expect(migrated.activities.orto).toBe(1);
    expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
  });
  it("tempo inverso, cap48h, import ripetuti ed economia futura rifiutata", () => {
    const old = legacy.createState(epoch);
    expect(normalizeSave(old, epoch - 1000)).toEqual({
      ...old,
      economyVersion: 2,
    });
    const a = normalizeSave(old, epoch + 259200_000),
      b = legacy.advance(old, epoch + 259200_000);
    expect(a.coins).toBe(b.coins);
    expect(
      normalizeSave(parseSave(JSON.stringify(a)), a.lastSimulatedAt),
    ).toEqual(a);
    expect(normalizeSave(old, epoch + 259200_000)).toEqual(a);
    expect(() =>
      parseSave(JSON.stringify({ ...a, economyVersion: 3 })),
    ).toThrow("Versione economica sconosciuta");
    expect(flow.economyVersion).toBe(2);
  });
});
