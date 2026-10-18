import { describe, expect, it } from "vitest";
import { activities, balance as b, creatures } from "../src/content";
import {
  advance,
  baseRate,
  clone,
  command,
  createState,
  rate,
  returnSummary,
  totalRate,
  upgradeCost,
  type Command,
  type State,
} from "../src/core/engine";
import { load, parseSave, save, SAVE_KEY } from "../src/persistence/save";
import { intersects } from "../src/scene/geometry";
const start = 1_800_000_000_000;
const act = (s: State, a: Command, now = s.lastSimulatedAt) =>
  command(s, a, now).state;
function wealthy() {
  return advance(createState(start), start + 86400_000);
}
function expanded() {
  let s = wealthy();
  for (const a of activities.slice(1)) {
    s = act(s, { type: "buyActivity", id: a.id });
    for (const id of ["sentiero", "ponte", "festa"])
      s = act(s, { type: "completeProject", id });
  }
  return s;
}
describe("economia e comandi atomici", () => {
  it("parte esattamente dai dati concordati", () => {
    const s = createState(start);
    expect(s.coins).toBe(25);
    expect(s.lifetimeCoins).toBe(0);
    expect(s.crystals).toBe(0);
    expect(s.activities).toEqual({
      orto: 1,
      vivaio: 0,
      mulino: 0,
      laboratorio: 0,
    });
    expect(s.creatures.momo.assignedActivityId).toBe("orto");
    expect(totalRate(s)).toBeCloseTo(0.65);
  });
  it("produce monete frazionarie, spende solo quelle presenti e non lifetime", () => {
    let s = advance(createState(start), start + 1000);
    expect(s.coins).toBeCloseTo(25.65);
    s = act(s, { type: "upgradeActivity", id: "orto" });
    expect(s.coins).toBeCloseTo(0.65);
    expect(s.lifetimeCoins).toBeCloseTo(0.65);
    expect(
      command(s, { type: "upgradeActivity", id: "orto" }, s.lastSimulatedAt),
    ).toEqual({ state: s, error: "Monete insufficienti." });
  });
  it("non paga due volte un acquisto e risolve subito lo sblocco", () => {
    const s = wealthy(),
      bought = act(s, { type: "buyActivity", id: "vivaio" });
    expect(bought.coins).toBe(s.coins - 150);
    expect(bought.creatures.nibi.unlocked).toBe(true);
    expect(bought.creatures.nibi.assignedActivityId).toBe("vivaio");
    expect(act(bought, { type: "buyActivity", id: "vivaio" })).toEqual(bought);
  });
  it("rispetta prerequisiti e limite attività", () => {
    const s = wealthy();
    expect(act(s, { type: "buyActivity", id: "mulino" })).toEqual(s);
    s.activities.orto = 50;
    expect(act(s, { type: "upgradeActivity", id: "orto" })).toEqual(s);
    expect(upgradeCost(createState(start), "orto")).toBe(25);
  });
  it("completa la sequenza senza bonus, premi tutti una volta e residuo 5 cristalli", () => {
    const s = expanded();
    expect(s.completedProjects).toEqual(["sentiero", "ponte", "festa"]);
    expect(s.crystals).toBe(5);
    expect(s.claimedMilestoneIds).toHaveLength(5);
    expect(s.creatures.tula.unlocked).toBe(true);
    expect(act(s, { type: "completeProject", id: "festa" })).toEqual(s);
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it("rifiuta progetti non in ordine e comandi con ID sconosciuti", () => {
    const s = wealthy();
    for (const a of [
      { type: "completeProject", id: "ponte" },
      { type: "buyActivity", id: "fantasma" },
      { type: "encourage", id: "fantasma" },
    ] as Command[])
      expect(act(s, a)).toEqual(s);
  });
});
describe("bonus, crescita, assegnazione e prodotti", () => {
  it("carezza 30s, throttle 500ms, rinnovo non cumulativo", () => {
    let s = act(createState(start), { type: "encourage", id: "momo" });
    expect(rate(s, "orto")).toBeCloseTo(0.975);
    const refresh = command(s, { type: "encourage", id: "momo" }, start + 499);
    expect(refresh.error).toBeTruthy();
    expect(refresh.state.creatures.momo.encouragedUntil).toBe(start + 30_000);
    s = act(s, { type: "encourage", id: "momo" }, start + 500);
    expect(s.creatures.momo.encouragedUntil).toBe(start + 30_500);
    s = advance(s, start + 30_500);
    expect(rate(s, "orto")).toBeCloseTo(0.65);
    expect(s.creatures.momo.level).toBe(1);
  });
  it("festival sbloccato, durata 20s cooldown 300s, bonus massimo 2", () => {
    expect(
      command(createState(start), { type: "activateFestival" }, start).error,
    ).toBeTruthy();
    let s = expanded();
    const now = s.lastSimulatedAt;
    s = act(s, { type: "activateFestival" });
    s = act(s, { type: "encourage", id: "momo" });
    expect(rate(s, "orto")).toBeCloseTo(baseRate(s, "orto") * 2);
    expect(
      command(s, { type: "activateFestival" }, now + 1000).error,
    ).toBeTruthy();
    s = advance(s, now + 20_000);
    expect(rate(s, "orto")).toBeCloseTo(baseRate(s, "orto") * 1.5);
    s = advance(s, now + 300_000);
    expect(
      command(s, { type: "activateFestival" }, s.lastSimulatedAt).error,
    ).toBeUndefined();
  });
  it("la crescita cambia il tasso al preciso confine XP e si ferma a 20", () => {
    const s = advance(createState(start), start + 100_000);
    expect(s.creatures.momo.level).toBe(2);
    expect(s.creatures.momo.xpInLevel).toBe(50);
    expect(s.lifetimeCoins).toBeCloseTo(0.65 * 50 + 0.66 * 50);
    const full = wealthy();
    expect(full.creatures.momo.level).toBe(20);
    expect(full.creatures.momo.xpInLevel).toBe(0);
  });
  it("sposta gratis, riconcilia prima e non duplica il bonus; occupata rifiutata", () => {
    let s = act(wealthy(), { type: "buyActivity", id: "vivaio" });
    expect(
      command(
        s,
        { type: "assignCreature", id: "momo", activityId: "vivaio" },
        s.lastSimulatedAt,
      ).error,
    ).toBeTruthy();
    s = act(s, { type: "assignCreature", id: "nibi", activityId: null });
    s = act(s, { type: "encourage", id: "momo" });
    const before = clone(s);
    s = act(
      s,
      { type: "assignCreature", id: "momo", activityId: "vivaio" },
      s.lastSimulatedAt + 10_000,
    );
    expect(s.lifetimeCoins - before.lifetimeCoins).toBeCloseTo(
      (rate(before, "orto") + rate(before, "vivaio")) * 10,
    );
    expect(rate(s, "orto")).toBe(0.5);
    expect(rate(s, "vivaio")).toBeCloseTo(0.8 * 1.48 * 1.5);
    expect(
      command(s, { type: "encourage", id: "nibi" }, s.lastSimulatedAt).error,
    ).toBeTruthy();
  });
  it("prodotto singolo a 180s, congelato, premio senza boost e niente XP", () => {
    let s = advance(createState(start), start + 179_000);
    expect(s.specialProducts.orto.ready).toBe(false);
    s = advance(s, start + 180_000);
    expect(s.specialProducts.orto.ready).toBe(true);
    s = advance(s, start + 3600_000);
    expect(s.specialProducts.orto.secondsAccumulated).toBe(180);
    s = act(s, { type: "encourage", id: "momo" });
    const before = clone(s);
    s = act(s, { type: "collectProduct", id: "orto" });
    expect(s.coins - before.coins).toBeCloseTo(baseRate(before, "orto") * 10);
    expect(s.creatures).toEqual(before.creatures);
    expect(s.specialProducts.orto).toEqual({
      ready: false,
      secondsAccumulated: 0,
    });
    expect(act(s, { type: "collectProduct", id: "orto" })).toEqual(s);
  });
});
describe("tempo controllabile e offline", () => {
  for (const seconds of [0, 60, 3600, 172800, 259200])
    it(`assenza ${seconds}s e cap senza doppio accredito`, () => {
      const s = createState(start),
        a = advance(s, start + seconds * 1000);
      expect(advance(a, a.lastSimulatedAt)).toEqual(a);
      expect(a.lastSimulatedAt).toBe(start + seconds * 1000);
      const capped = advance(s, start + Math.min(seconds, 172800) * 1000);
      expect(a.lifetimeCoins).toBeCloseTo(capped.lifetimeCoins);
      const report = returnSummary(s, a);
      expect(report.counted).toBe(Math.min(seconds, 172800));
      expect(report.capped).toBe(seconds > 172800);
    });
  it("tempo negativo e non finito non spostano il riferimento", () => {
    const s = wealthy();
    expect(advance(s, start)).toEqual(s);
    expect(advance(s, Infinity)).toEqual(s);
    expect(advance(s, NaN)).toEqual(s);
  });
  it("online a quarti di secondo uguale ad offline con scadenze e crescita", () => {
    const s = act(createState(start), { type: "encourage", id: "momo" });
    let online = s;
    for (let t = 250; t <= 120_000; t += 250)
      online = advance(online, start + t);
    const offline = advance(s, start + 120_000);
    expect(online.lifetimeCoins).toBeCloseTo(offline.lifetimeCoins, 7);
    expect(online.creatures).toEqual(offline.creatures);
  });
  it("partizionamento equivalente per molti confini e tutte le creature", () => {
    let s = expanded();
    s = act(s, { type: "activateFestival" });
    for (const c of creatures) s = act(s, { type: "encourage", id: c.id });
    const end = s.lastSimulatedAt + 86_400_000,
      single = advance(s, end);
    for (const delta of [
      1, 499, 20_000, 30_000, 50_000, 67_123, 3_600_000, 80_000_000,
    ]) {
      const split = advance(advance(s, s.lastSimulatedAt + delta), end);
      expect(split.coins).toBeCloseTo(single.coins, 6);
      expect(split.creatures).toEqual(single.creatures);
      expect(split.specialProducts).toEqual(single.specialProducts);
    }
  });
  it("oltre il cap, boost residui solo per la durata e cooldown scaduto", () => {
    let s = act(expanded(), { type: "activateFestival" });
    s = act(s, { type: "encourage", id: "momo" });
    const a = advance(s, s.lastSimulatedAt + 200_000_000);
    expect(a.festivalReadyAt).toBeLessThan(a.lastSimulatedAt);
    expect(rate(a, "orto")).toBe(baseRate(a, "orto"));
    const tail = advance(a, a.lastSimulatedAt + 1000);
    expect(tail.coins - a.coins).toBeCloseTo(totalRate(a));
  });
});
describe("salvataggi e recupero", () => {
  it("save/load/export/import mantengono l’intero stato", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    const s = expanded();
    expect(save(storage, s)).toBe(true);
    expect(load(storage, start).state).toEqual(s);
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it("storage negato è recuperabile e corrotto conserva la copia", () => {
    const denied = {
      getItem: () => {
        throw new Error();
      },
      setItem: () => {
        throw new Error();
      },
    };
    expect(load(denied, start).warning).toBe(
      "Il salvataggio non è disponibile",
    );
    expect(save(denied, createState(start))).toBe(false);
    const data = new Map([[SAVE_KEY, "{oops"]]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    expect(load(storage, start).corrupt).toBe("{oops");
    expect(data.get(`${SAVE_KEY}.recovery`)).toBe("{oops");
    expect(data.get(SAVE_KEY)).toBe("{oops");
  });
  it("rifiuta versioni, numeri, ID, assegnazioni, progressi e premi incoerenti", () => {
    const mutations: ((s: State) => void)[] = [
      (s) => {
        s.schemaVersion = 2 as 1;
      },
      (s) => {
        s.coins = -1;
      },
      (s) => {
        s.coins = Infinity;
      },
      (s) => {
        s.activities.ignoto = 1;
      },
      (s) => {
        s.creatures.momo.level = 21;
      },
      (s) => {
        s.creatures.momo.assignedActivityId = "fantasma";
      },
      (s) => {
        s.completedProjects = ["ponte"];
      },
      (s) => {
        s.claimedMilestoneIds = ["coins100"];
      },
      (s) => {
        s.specialProducts.orto.ready = true;
      },
      (s) => {
        s.activities.mulino = 1;
      },
      (s) => {
        s.crystals = 10;
      },
    ];
    for (const mutate of mutations) {
      const s = createState(start);
      mutate(s);
      expect(() => parseSave(JSON.stringify(s))).toThrow();
    }
    const s = expanded();
    s.creatures.nibi.assignedActivityId = "orto";
    expect(() => parseSave(JSON.stringify(s))).toThrow();
  });
});
describe("gesti", () => {
  it("interseca segmenti veloci, bordi e diagonali ma non hover esterno", () => {
    const rect = { left: 20, right: 40, top: 20, bottom: 40 };
    expect(intersects({ x: 0, y: 30 }, { x: 100, y: 30 }, rect)).toBe(true);
    expect(intersects({ x: 30, y: 0 }, { x: 30, y: 100 }, rect)).toBe(true);
    expect(intersects({ x: 0, y: 0 }, { x: 100, y: 100 }, rect)).toBe(true);
    expect(intersects({ x: 0, y: 10 }, { x: 100, y: 10 }, rect)).toBe(false);
    expect(intersects({ x: 30, y: 30 }, { x: 30, y: 30 }, rect)).toBe(true);
  });
});
