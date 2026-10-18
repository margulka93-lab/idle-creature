import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  createState,
  command,
  advance,
  type State,
} from "../../src/core/engine";
import { SAVE_KEY } from "../../src/persistence/save";
const epoch = 1_800_000_000_000;
async function seed(page: Page, state = createState(epoch)) {
  await page.clock.install({ time: new Date(epoch - 1000) });
  await page.clock.pauseAt(new Date(epoch));
  await page.addInitScript(
    ({ key, state }) => {
      if (!sessionStorage.getItem("f03-seeded")) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem("f03-seeded", "1");
      }
    },
    { key: SAVE_KEY, state },
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Incoraggia Momo", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page
        .locator(".scene-backdrop img")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
}
const saved = (page: Page): Promise<State> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
async function shot(page: Page, profile: string, name: string) {
  mkdirSync("docs/screenshots/f03", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/f03/${profile}-${name}.png`,
    animations: "disabled",
  });
}
const surface = (page: Page) =>
  page.locator(".mobile-dock:visible, .operations:visible");
function pair() {
  let s = createState(epoch - 180_000);
  s.coins = 500;
  s.lifetimeCoins = 500;
  s = command(
    s,
    { type: "buyActivity", id: "vivaio" },
    s.lastSimulatedAt,
  ).state;
  return advance(s, epoch);
}
test("F03 nuova partita, +1 esplicito senza cambiare PROSSIMO, dock e controlli leggibili", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.url());
  });
  await seed(page);
  await shot(page, info.project.name, "nuova-partita");
  const scope = surface(page);
  await expect(
    scope.getByRole("button", { name: "PROSSIMO", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await scope.getByRole("button", { name: /^Puoi comprare \+1/ }).click();
  expect((await saved(page)).activities.orto).toBe(2);
  await expect(
    scope.getByRole("button", { name: "PROSSIMO", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator(".toast")).toBeEmpty();
  const measurements = await page
    .locator("button:visible, select:visible")
    .evaluateAll((es) =>
      es.map((e) => ({
        name: e.getAttribute("aria-label") || e.textContent,
        w: e.getBoundingClientRect().width,
        h: e.getBoundingClientRect().height,
        font: parseFloat(getComputedStyle(e).fontSize),
      })),
    );
  expect(
    measurements.filter((e) => e.w < 43.9 || e.h < 43.9 || e.font < 14),
  ).toEqual([]);
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    main: document.querySelector(".main-content")!.scrollHeight,
    view: document.querySelector(".main-content")!.clientHeight,
    dock: document
      .querySelector(".mobile-dock")
      ?.getBoundingClientRect()
      .toJSON(),
    nav: document.querySelector("nav")!.getBoundingClientRect().toJSON(),
  }));
  expect(geometry.overflow).toBe(false);
  expect(geometry.main).toBeLessThanOrEqual(geometry.view + 1);
  if (info.project.name === "desktop") {
    const project = await page
      .getByRole("button", { name: /^Prossimo progetto:/ })
      .boundingBox();
    expect(project!.y + project!.height).toBeLessThan(838);
  } else {
    expect(geometry.dock.bottom).toBeLessThanOrEqual(geometry.nav.top);
  }
  writeFileSync(
    `docs/screenshots/f03/${info.project.name}-geometry.json`,
    JSON.stringify({ geometry, controls: measurements }, null, 2) + "\n",
  );
  expect(errors).toEqual([]);
});
test("F03 due creature: swipe, prodotto separato, progetto richiudibile e selezione stabile", async ({
  page,
  context,
}, info) => {
  await seed(page, pair());
  await shot(page, info.project.name, "due-creature");
  const a = await page
      .getByRole("button", { name: "Seleziona Momo", exact: true })
      .boundingBox(),
    b = await page
      .getByRole("button", { name: "Seleziona Nibi", exact: true })
      .boundingBox();
  const p = await page
    .getByRole("button", {
      name: "Raccogli prodotto Orto luminoso",
      exact: true,
    })
    .boundingBox();
  expect(a!.width).toBeGreaterThanOrEqual(88);
  expect(b!.x + b!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  expect(p!.x).toBeGreaterThanOrEqual(8);
  expect(
    Math.max(a!.x, p!.x) >= Math.min(a!.x + a!.width, p!.x + p!.width) ||
      Math.max(a!.y, p!.y) >= Math.min(a!.y + a!.height, p!.y + p!.height),
  ).toBe(true);
  const start = { x: a!.x + a!.width / 2, y: a!.y + a!.height / 2 },
    end = { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 };
  if (info.project.name === "desktop") {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 1 });
    await page.mouse.up();
  } else {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...end, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  let s = await saved(page);
  expect(s.creatures.momo.encouragedUntil).toBeGreaterThan(epoch);
  expect(s.creatures.nibi.encouragedUntil).toBeGreaterThan(epoch);
  expect(s.activities.vivaio).toBe(1);
  await expect(page.locator(".boost-label")).toHaveCount(2);
  const before = s.lifetimeCoins;
  await page
    .getByRole("button", {
      name: "Raccogli prodotto Orto luminoso",
      exact: true,
    })
    .click();
  s = await saved(page);
  expect(s.lifetimeCoins).toBeGreaterThan(before);
  expect(s.specialProducts.orto.ready).toBe(false);
  const opener = page.getByRole("button", { name: /^Prossimo progetto:/ });
  await opener.focus();
  await page.keyboard.press("Enter");
  await shot(page, info.project.name, "progetto");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Seleziona Orto luminoso", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("F03 traguardo dalla schermata principale e preview esatta accessibile", async ({
  page,
}, info) => {
  const s = createState(epoch);
  s.activities.orto = 8;
  s.coins = 153;
  s.lifetimeCoins = 153;
  s.crystals = 2;
  s.claimedMilestoneIds = ["coins100"];
  await seed(page, s);
  const scope = surface(page);
  await scope
    .getByRole("button", { name: "Anteprima Orto luminoso", exact: true })
    .click();
  await expect(page.locator(".quote-preview")).toContainText("153 monete");
  await expect(page.locator(".quote-preview")).toContainText("9,49");
  const close = page.getByRole("button", {
    name: "Chiudi Anteprima Orto luminoso",
    exact: true,
  });
  await close.focus();
  await page.clock.runFor(1000);
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  const buy = scope.getByRole("button", { name: /^Migliora Orto/ });
  await buy.click();
  expect((await saved(page)).activities.orto).toBe(10);
  await shot(page, info.project.name, "soglia");
  await expect(
    page
      .locator(".row-feedback:visible,.dock-feedback:visible")
      .filter({ hasText: "Traguardi L10 ×2" }),
  ).toHaveCount(1);
  const details = page.getByRole("button", {
    name: "Dettagli Orto luminoso",
    exact: true,
  });
  await details.click();
  const nestedOpener = page.getByRole("button", {
    name: "Vedi anteprima acquisto",
  });
  await nestedOpener.click();
  await expect(page.locator("dialog[open]")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(nestedOpener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(details).toBeFocused();
});
test("F03 ritorno discreto: acquisto immediato e nessun doppio accredito", async ({
  page,
}, info) => {
  const s = createState(epoch - 3600_000);
  s.activities.orto = 8;
  await seed(page, s);
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await shot(page, info.project.name, "offline");
  const before = await saved(page);
  await surface(page)
    .getByRole("button", { name: /^Migliora Orto/ })
    .click();
  expect((await saved(page)).activities.orto).toBe(10);
  await page.getByRole("button", { name: "Nascondi riepilogo" }).click();
  const after = await saved(page);
  await page.reload();
  expect((await saved(page)).coins).toBeCloseTo(after.coins, 5);
  expect(after.lifetimeCoins).toBe(before.lifetimeCoins);
});
test("F03 fallback reale, reduced motion, gestione a zoom200 e scroll fuori scena", async ({
  page,
}, info) => {
  await page.route("**/assets/f03/*.webp", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await expect
    .poll(() => page.locator(".scene-backdrop img").getAttribute("src"))
    .toBe("/assets/landscape.svg");
  await expect
    .poll(() =>
      page
        .locator(".scene-creature img")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
  expect(
    await page
      .locator(".scene-creature img")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  if (info.project.name !== "desktop")
    await page
      .getByRole("button", { name: "Gestisci quattro attività" })
      .click();
  const rows = page.locator(".activity-row");
  await expect(rows).toHaveCount(4);
  await page.getByTestId("activity-laboratorio").scrollIntoViewIfNeeded();
  await page.setViewportSize({
    width: info.project.use.viewport!.width / 2,
    height: info.project.use.viewport!.height / 2,
  });
  const open = page.getByRole("button", { name: "Gestisci quattro attività" });
  if (
    (await open.isVisible()) &&
    (await page.locator(".management-drawer[open]").count()) === 0
  )
    await open.click();
  await page
    .getByTestId("activity-laboratorio")
    .getByRole("button", {
      name: "Anteprima Laboratorio delle lucciole",
      exact: true,
    })
    .click();
  await expect(page.locator("dialog[open]").last()).toBeVisible();
  await page
    .getByRole("button", {
      name: "Chiudi Anteprima Laboratorio delle lucciole",
      exact: true,
    })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await shot(page, info.project.name, "zoom200-fallback");
});
test("F03 tre creature e quattro prodotti: hitbox disgiunte e tutte dentro la scena", async ({
  page,
}, info) => {
  let s = pair();
  s.activities.orto = 10;
  s.coins = 10000;
  s.lifetimeCoins = 10000;

  s = command(s, { type: "completeProject", id: "sentiero" }, epoch).state;
  s = command(s, { type: "buyActivity", id: "mulino" }, epoch).state;
  s.activities.vivaio = 10;
  s.activities.mulino = 10;
  s = command(s, { type: "completeProject", id: "ponte" }, epoch).state;
  s = command(s, { type: "buyActivity", id: "laboratorio" }, epoch).state;
  s = advance(s, epoch + 180_000);
  await page.clock.install({ time: new Date(epoch + 180_000) });
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: SAVE_KEY, state: s },
  );
  await page.goto("/");
  await expect(page.locator(".scene-creature")).toHaveCount(3);
  await expect(page.locator(".product")).toHaveCount(4);
  const geometry = await page.getByTestId("scene").evaluate((scene) => {
    const rect = (e: Element) => e.getBoundingClientRect().toJSON();
    return {
      scene: rect(scene),
      creatures: [...scene.querySelectorAll(".scene-creature")].map(rect),
      products: [...scene.querySelectorAll(".product")].map(rect),
    };
  });
  const disjoint = (a: any, b: any) =>
    a.right <= b.left ||
    b.right <= a.left ||
    a.bottom <= b.top ||
    b.bottom <= a.top;
  for (const product of geometry.products) {
    for (const creature of geometry.creatures)
      expect(disjoint(product, creature)).toBe(true);
    expect(product.left).toBeGreaterThanOrEqual(geometry.scene.left);
    expect(product.right).toBeLessThanOrEqual(geometry.scene.right);
  }
  for (let i = 0; i < geometry.creatures.length; i++)
    for (let j = i + 1; j < geometry.creatures.length; j++)
      expect(disjoint(geometry.creatures[i], geometry.creatures[j])).toBe(true);
  await shot(page, info.project.name, "tre-creature");
});
