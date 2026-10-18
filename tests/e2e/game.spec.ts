import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { activities } from "../../src/content";
import {
  advance,
  command,
  createState,
  type State,
} from "../../src/core/engine";
import * as legacy from "../../src/core/legacy-v1";
import {
  normalizeSave,
  BACKUP_KEY,
  SAVE_KEY,
} from "../../src/persistence/save";
async function manage(page: Page) {
  const open = page.getByRole("button", { name: "Gestisci quattro attività" });
  if (await open.isVisible()) await open.click();
}
async function closeManage(page: Page) {
  const close = page.getByRole("button", {
    name: "Chiudi Gestione del borgo",
    exact: true,
  });
  if (await close.isVisible()) await close.click();
}
async function project(page: Page) {
  await page
    .getByRole("button", { name: /^Prossimo progetto:/ })
    .last()
    .click();
}
const epoch = 1_800_000_000_000;
function progressed() {
  let s = legacy.advance(legacy.createState(epoch - 86400_000), epoch);
  for (const a of activities.slice(1)) {
    s = legacy.command(s, { type: "buyActivity", id: a.id }, epoch).state;
    for (const id of ["sentiero", "ponte", "festa"])
      s = legacy.command(s, { type: "completeProject", id }, epoch).state;
  }
  return normalizeSave(s, epoch);
}
async function setup(page: Page, state?: State, url = "/") {
  await page.clock.install({ time: new Date(epoch) });
  if (state)
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
      key: SAVE_KEY,
      raw: JSON.stringify(state),
    });
  await page.goto(url);
  await expect(
    page.getByRole("button", { name: "Incoraggia Momo" }),
  ).toBeEnabled();
}
async function saved(page: Page): Promise<State> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
}
test("primi due minuti normali, selezione, upgrade, tastiera e reload", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await setup(page);
  expect((await saved(page)).coins).toBeCloseTo(25, 0);
  await page
    .getByRole("button", { name: "Seleziona Vivaio delle gemme" })
    .click();
  expect((await saved(page)).activities.vivaio).toBe(0);
  await page.getByRole("button", { name: "Seleziona Orto luminoso" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /Incoraggia Momo/ }).focus();
  await page.keyboard.press("Enter");
  expect((await saved(page)).creatures.momo.encouragedUntil).toBeGreaterThan(
    epoch,
  );
  await manage(page);
  await page.getByRole("button", { name: "+1", exact: true }).last().click();
  await page
    .getByTestId("activity-orto")
    .getByRole("button", { name: /^Migliora / })
    .click();
  expect((await saved(page)).activities.orto).toBe(2);
  await closeManage(page);
  await page.clock.runFor(121_000);
  expect((await saved(page)).lifetimeCoins).toBeGreaterThan(140);
  await page.reload();
  expect((await saved(page)).activities.orto).toBe(2);
  mkdirSync("docs/screenshots/f03", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/f03/${info.project.name}-inizio.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("scena, pannelli, assegnazioni, raccolta e layout completo", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await setup(page, progressed());
  expect((await saved(page)).completedProjects).toContain("festa");
  const before = (await saved(page)).lifetimeCoins;
  await page
    .getByRole("button", {
      name: "Raccogli prodotto Orto luminoso",
      exact: true,
    })
    .click();
  expect((await saved(page)).lifetimeCoins).toBeGreaterThan(before);
  await page
    .getByRole("button", { name: "Attiva meraviglie", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Meraviglie in corso" }),
  ).toBeDisabled();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Creature/ })
    .click();
  await page.getByLabel("Dove lavora Momo").selectOption("laboratorio");
  expect((await saved(page)).creatures.momo.assignedActivityId).toBe(
    "laboratorio",
  );
  await page.getByLabel("Dove lavora Nibi").selectOption("orto");
  expect((await saved(page)).creatures.nibi.assignedActivityId).toBe("orto");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Progetti" })
    .click();
  await expect(
    page.getByText("Il ponte delle lucciole", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Collezione" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tula", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Borgo" })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/screenshots/f03/${info.project.name}-borgo.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("swipe veloce attraversa più creature senza acquisti o tap; hover e cancel", async ({
  page,
}) => {
  await setup(page, progressed());
  const momo = await page
    .getByRole("button", { name: "Seleziona Momo", exact: true })
    .boundingBox();
  const nibi = await page
    .getByRole("button", { name: "Seleziona Nibi", exact: true })
    .boundingBox();
  expect(momo).toBeTruthy();
  expect(nibi).toBeTruthy();
  const start = { x: momo!.x + momo!.width / 2, y: momo!.y + momo!.height / 2 };
  const end = { x: nibi!.x + nibi!.width / 2, y: nibi!.y + nibi!.height / 2 };
  await page.mouse.move(start.x, start.y);
  expect((await saved(page)).creatures.momo.encouragedUntil).toBe(0);
  const levels = (await saved(page)).activities;
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 1 });
  await page.mouse.up();
  const after = await saved(page);
  expect(after.creatures.momo.encouragedUntil).toBeGreaterThan(epoch);
  expect(after.creatures.nibi.encouragedUntil).toBeGreaterThan(epoch);
  expect(after.activities).toEqual(levels);
  const scene = page.getByTestId("scene");
  await scene.dispatchEvent("pointerdown", {
    pointerId: 42,
    isPrimary: true,
    button: 0,
    clientX: start.x,
    clientY: start.y,
  });
  await scene.dispatchEvent("pointercancel", { pointerId: 42 });
  await scene.dispatchEvent("pointermove", {
    pointerId: 42,
    clientX: end.x,
    clientY: end.y,
  });
  await expect(
    page.getByRole("region", { name: "Dettagli attività selezionata" }),
  ).toHaveCount(0);
});
test("touch reale: scroll esterno, scena ferma, multitouch ignorato e tap seleziona", async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name === "desktop", "Touch solo nei profili mobile");
  await setup(page, progressed());
  const cdp = await context.newCDPSession(page);
  await page.getByRole("button", { name: "Seleziona Nibi", exact: true }).tap();
  await expect(
    page.getByRole("button", {
      name: "Seleziona Vivaio delle gemme",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Seleziona Momo", exact: true }).tap();
  await page.setViewportSize({
    width: info.project.use.viewport!.width,
    height: 600,
  });
  await manage(page);
  const scrollBody = page.locator(".management-drawer .dialog-scroll");
  const scrollBox = (await scrollBody.boundingBox())!;
  expect(
    await scrollBody.evaluate((e) => e.scrollHeight - e.clientHeight),
  ).toBeGreaterThan(0);
  const touchStart = {
    x: scrollBox.x + 20,
    y: scrollBox.y + scrollBox.height - 40,
    id: 1,
  };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchStart],
  });
  for (let step = 1; step <= 8; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...touchStart, y: touchStart.y - step * 25 }],
    });
    await page.waitForTimeout(30);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page
        .locator(".management-drawer .dialog-scroll")
        .evaluate((e) => e.scrollTop),
    )
    .toBeGreaterThan(0);
  await closeManage(page);
  await page.setViewportSize(info.project.use.viewport!);
  const first = await saved(page);
  expect(first.creatures.momo.encouragedUntil).toBe(0);
  await page.evaluate(() => scrollTo(0, 0));
  const r = await page
    .getByRole("button", { name: "Seleziona Momo", exact: true })
    .boundingBox();
  const x = r!.x + r!.width / 2,
    y = r!.y + r!.height / 2;
  const scrollBefore = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 30, y: y + 15, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await saved(page)).creatures.momo.encouragedUntil).toBeGreaterThan(
    epoch,
  );
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  await page.getByRole("button", { name: "Seleziona Nibi", exact: true }).tap();
  await expect(
    page.getByRole("button", {
      name: "Seleziona Vivaio delle gemme",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  const scene = page.getByTestId("scene");
  await scene.dispatchEvent("pointerdown", {
    pointerId: 99,
    isPrimary: false,
    button: 0,
    clientX: 0,
    clientY: 0,
  });
  await scene.dispatchEvent("pointermove", {
    pointerId: 99,
    clientX: 900,
    clientY: 900,
  });
  expect((await saved(page)).creatures.nibi.encouragedUntil).toBe(0);
});
test("salvataggio, export/import validato e reset con conferma", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: "Impostazioni", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta partita JSON" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/borgo-.*\.json/);
  await page
    .getByLabel("Oppure incolla un salvataggio JSON")
    .fill('{"schemaVersion":999}');
  await page.getByRole("button", { name: "Valida e importa" }).click();
  await expect(page.locator(".settings-result")).toBeVisible();
  await page
    .getByLabel("Oppure incolla un salvataggio JSON")
    .fill(JSON.stringify(progressed()));
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Valida e importa" }).click();
  expect((await saved(page)).completedProjects).toHaveLength(3);
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Riparti da zero", exact: true })
    .click();
  expect((await saved(page)).completedProjects).toHaveLength(3);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Riparti da zero", exact: true })
    .click();
  expect((await saved(page)).coins).toBe(25);
});
test("salvataggio corrotto non sovrascritto; reset esplicito", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{corrotto"),
    SAVE_KEY,
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Esporta dati originali" }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe("{corrotto");
  await expect(
    page.getByRole("button", { name: /Incoraggia Momo/ }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Riparti da zero", exact: true })
    .click();
  expect((await saved(page)).schemaVersion).toBe(1);
});
test("storage negato: partita in memoria e avviso persistente", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Negato", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toHaveText(
    "Il salvataggio non è disponibile",
  );
  await page.getByRole("button", { name: /Incoraggia Momo/ }).click();
  await expect(page.locator(".boost-label")).toContainText("+50%");
  await expect(page.locator(".toast")).toBeEmpty();
});
test("offline 1h con riepilogo: chiusura e reload senza doppio accredito", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(epoch) });
  await page.addInitScript(
    ({ key, raw }) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key, raw);
        sessionStorage.setItem("seeded", "1");
      }
    },
    { key: SAVE_KEY, raw: JSON.stringify(createState(epoch - 3600_000)) },
  );
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  const a = await saved(page);
  await page.getByRole("button", { name: "Nascondi riepilogo" }).click();
  expect((await saved(page)).lifetimeCoins).toBe(a.lifetimeCoins);
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).not.toBeVisible();
  expect((await saved(page)).lifetimeCoins).toBeCloseTo(a.lifetimeCoins, 0);
});
test("ritorno dal background riconciliato una sola volta", async ({ page }) => {
  await setup(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => (window as unknown as { testHidden: boolean }).testHidden,
    });
    (window as unknown as { testHidden: boolean }).testHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const before = await saved(page);
  await page.clock.fastForward(3600_000);
  expect((await saved(page)).lifetimeCoins).toBe(before.lifetimeCoins);
  await page.evaluate(() => {
    (window as unknown as { testHidden: boolean }).testHidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  const returned = await saved(page);
  expect(returned.lifetimeCoins).toBeGreaterThan(2000);
  await page.getByRole("button", { name: "Nascondi riepilogo" }).click();
  expect((await saved(page)).lifetimeCoins).toBe(returned.lifetimeCoins);
});
test("percorso F02 completo dalla lista, gate espliciti e ritorno non bloccante", async ({
  page,
}) => {
  await setup(page);
  await manage(page);
  const row = (id: string) => page.getByTestId("activity-" + id);
  await page.getByRole("button", { name: "+1", exact: true }).last().click();
  await row("orto")
    .getByRole("button", { name: /^Migliora / })
    .click();
  await page.clock.fastForward(3600_000);
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  // Buy without dismissing the return summary or selecting a station.
  await page
    .getByRole("button", { name: "PROSSIMO", exact: true })
    .last()
    .click();
  await row("orto")
    .getByRole("button", { name: /^Migliora / })
    .click();
  await row("vivaio")
    .getByRole("button", { name: /^Costruisci / })
    .click();
  await project(page);
  await page
    .getByRole("dialog", { name: "Prossimo progetto", exact: true })
    .getByRole("button", { name: "Realizza progetto" })
    .click();
  await page
    .getByRole("button", { name: "Chiudi Prossimo progetto", exact: true })
    .click();
  await row("mulino")
    .getByRole("button", { name: /^Costruisci / })
    .click();
  await project(page);
  await expect(
    page
      .getByRole("dialog", { name: "Prossimo progetto", exact: true })
      .getByRole("button", { name: "Realizza progetto" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Chiudi Prossimo progetto", exact: true })
    .click();
  await page.clock.fastForward(3600_000);
  for (const id of ["vivaio", "mulino"])
    await row(id)
      .getByRole("button", { name: /^Migliora / })
      .click();
  await project(page);
  await page
    .getByRole("dialog", { name: "Prossimo progetto", exact: true })
    .getByRole("button", { name: "Realizza progetto" })
    .click();
  await page
    .getByRole("button", { name: "Chiudi Prossimo progetto", exact: true })
    .click();
  await row("laboratorio")
    .getByRole("button", { name: /^Costruisci / })
    .click();
  await project(page);
  await expect(
    page
      .getByRole("dialog", { name: "Prossimo progetto", exact: true })
      .getByRole("button", { name: "Realizza progetto" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Chiudi Prossimo progetto", exact: true })
    .click();
  await page.clock.fastForward(3600_000);
  for (const id of ["orto", "vivaio", "mulino", "laboratorio"]) {
    while ((await saved(page)).activities[id] < 25)
      await row(id)
        .getByRole("button", { name: /^Migliora / })
        .click();
  }
  await project(page);
  await page
    .getByRole("dialog", { name: "Prossimo progetto", exact: true })
    .getByRole("button", { name: "Realizza progetto" })
    .click();
  await page
    .getByRole("button", { name: "Chiudi Prossimo progetto", exact: true })
    .click();
  expect((await saved(page)).completedProjects).toContain("festa");
  expect((await saved(page)).completedProjects).toEqual([
    "sentiero",
    "ponte",
    "festa",
  ]);
  await closeManage(page);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("seconda scheda non avanza né scrive; takeover esplicito", async ({
  page,
  context,
}) => {
  await setup(page);
  const before = await saved(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(
    other.getByText(/Questa scheda è in sola lettura/),
  ).toBeVisible();
  await expect(
    other.getByRole("button", { name: /Incoraggia Momo/ }),
  ).toBeDisabled();
  expect(
    (await saved(other)).lifetimeCoins - before.lifetimeCoins,
  ).toBeLessThan(3);
  await page.close();
  await other.clock.fastForward(3600_000);
  const readonlyBalance = (await saved(other)).lifetimeCoins;
  expect(readonlyBalance - before.lifetimeCoins).toBeLessThan(3);
  await other.getByRole("button", { name: /Riprova dopo/ }).click();
  await expect(
    other.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  await other.getByRole("button", { name: "Nascondi riepilogo" }).click();
  await expect(
    other.getByRole("button", { name: /Incoraggia Momo/ }),
  ).toBeEnabled();
  expect((await saved(other)).lifetimeCoins).toBeGreaterThan(2000);
  await other.close();
});
test("reduced motion e strumenti debug solo in sviluppo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, undefined, "/?debug=1");
  expect(
    await page
      .locator(".scene-creature img")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "Salta 60s", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nascondi riepilogo" }).click();
  expect((await saved(page)).lifetimeCoins).toBeGreaterThan(30);
  await page
    .getByRole("button", { name: "Sblocchi di test", exact: true })
    .click();
  await page.getByRole("button", { name: "Nascondi riepilogo" }).click();
  expect((await saved(page)).completedProjects).toContain("festa");
  await page.goto("http://127.0.0.1:4173/?debug=1");
  await expect(
    page.getByRole("region", { name: "Diagnostica sviluppo" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Salta 60s", exact: true }),
  ).toHaveCount(0);
});
