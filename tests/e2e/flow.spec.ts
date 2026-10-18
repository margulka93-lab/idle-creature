import { test, expect, type Page } from "@playwright/test";
import {
  createState,
  baseRate,
  quoteUpgrade,
  type State,
} from "../../src/core/engine";
import * as legacy from "../../src/core/legacy-v1";
import { SAVE_KEY, BACKUP_KEY } from "../../src/persistence/save";
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
const epoch = 1_800_000_000_000;
const saved = (page: Page): Promise<State> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
async function seed(page: Page, raw: string) {
  await page.clock.install({ time: new Date(epoch - 1000) });
  await page.clock.pauseAt(new Date(epoch));
  await page.addInitScript(
    ({ key, raw }) => {
      if (!sessionStorage.getItem("flow-seeded")) {
        localStorage.setItem(key, raw);
        sessionStorage.setItem("flow-seeded", "1");
      }
    },
    { key: SAVE_KEY, raw },
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Incoraggia Momo/ }),
  ).toBeEnabled();
  await manage(page);
}
function L8() {
  const s = createState(epoch);
  s.activities.orto = 8;
  s.coins = 153;
  s.lifetimeCoins = 153;
  s.claimedMilestoneIds = ["coins100"];
  s.crystals = 2;
  return s;
}
test("F02: default PROSSIMO, quote153 e upgrade diretto, focus e preferenza stabile", async ({
  page,
}, info) => {
  await seed(page, JSON.stringify(L8()));
  await expect(
    page.getByRole("button", { name: "PROSSIMO", exact: true }).last(),
  ).toHaveAttribute("aria-pressed", "true");
  const row = page.getByTestId("activity-orto");
  await expect(row).toContainText("153 monete");
  await row
    .getByRole("button", { name: "Anteprima Orto luminoso", exact: true })
    .click();
  await expect(page.locator(".quote-preview")).toContainText("3,835");
  await expect(page.locator(".quote-preview")).toContainText("9,49");
  await page
    .getByRole("button", {
      name: "Chiudi Anteprima Orto luminoso",
      exact: true,
    })
    .click();
  const order = await page
    .locator(".activity-row")
    .evaluateAll((es) => es.map((e) => e.getAttribute("data-testid")));
  const button = row.getByRole("button", { name: /^Migliora / });
  await button.focus();
  await page.clock.runFor(1000);
  await expect(button).toBeFocused();
  await button.click();
  expect((await saved(page)).activities.orto).toBe(10);
  await expect(row.getByRole("status")).toContainText("Traguardi L10 ×2");
  await page.screenshot({
    path: `docs/screenshots/f03/${info.project.name}-traguardo.png`,
    fullPage: true,
    animations: "disabled",
  });
  await expect(
    page.getByRole("region", { name: "Dettagli attività selezionata" }),
  ).toHaveCount(0);
  expect(
    await page
      .locator(".activity-row")
      .evaluateAll((es) => es.map((e) => e.getAttribute("data-testid"))),
  ).toEqual(order);
  await page.getByRole("button", { name: "+10", exact: true }).last().click();
  await expect(row.getByRole("button", { name: /^Migliora / })).toBeDisabled();
  await page.getByRole("button", { name: "MAX", exact: true }).last().click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "MAX", exact: true }).last(),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await saved(page)).activities.orto).toBe(10);
});
test("F02: MAX attraversa tutte le soglie in un click, nessun toast da carezze", async ({
  page,
}) => {
  const s = L8();
  s.coins = 10_000_000;
  s.lifetimeCoins = 10_000_000;
  s.claimedMilestoneIds = [
    "coins100",
    "coins500",
    "coins1500",
    "coins5000",
    "coins10000",
  ];
  s.crystals = 28;
  await seed(page, JSON.stringify(s));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const row = page.getByTestId("activity-orto");
  await page.getByRole("button", { name: "MAX", exact: true }).last().click();
  const q = quoteUpgrade(s, "orto", "max");
  await row.getByRole("button", { name: /^Migliora / }).click();
  const after = await saved(page);
  expect(after.activities.orto).toBe(50);
  expect(after.coins).toBeCloseTo(s.coins - q.cost, 0);
  await expect(row.getByRole("status")).toContainText("L10 ×2, L25 ×2, L50 ×2");
  await expect(
    row.getByRole("button", { name: "Orto luminoso: Massimo" }),
  ).toBeDisabled();
  await closeManage(page);
  const pet = page.getByRole("button", { name: /Incoraggia Momo/ });
  await pet.click();
  await pet.click();
  await expect(page.locator(".toast")).toBeEmpty();
  await expect(page.locator(".boost-label")).toContainText("+50%");
  await expect(
    page.locator("dialog[open]:not(.management-drawer)"),
  ).toHaveCount(0);
});
test("F02: v1 offline migrato senza retroattività, backup esportabile e reload idempotente", async ({
  page,
}, info) => {
  let s = legacy.advance(
    legacy.createState(epoch - 7200_000),
    epoch - 3600_000,
  );
  s.activities.orto = 25;
  const expected = legacy.advance(s, epoch),
    raw = JSON.stringify(s);
  await seed(page, raw);
  const migrated = await saved(page);
  expect(migrated.economyVersion).toBe(2);
  expect(migrated.coins).toBeCloseTo(expected.coins, 0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), BACKUP_KEY),
  ).toBe(raw);
  await expect(
    page.getByRole("complementary", { name: "Riepilogo ritorno" }),
  ).toBeVisible();
  await expect(
    page.locator("dialog[open]:not(.management-drawer)"),
  ).toHaveCount(0);
  await page.screenshot({
    path: `docs/screenshots/f03/${info.project.name}-ritorno.png`,
    fullPage: true,
    animations: "disabled",
  });
  // No dismissal required before this direct upgrade.
  await page.getByRole("button", { name: "+1", exact: true }).last().click();
  await page
    .getByTestId("activity-orto")
    .getByRole("button", { name: /^Migliora / })
    .click();
  expect((await saved(page)).activities.orto).toBe(26);
  await closeManage(page);
  await page.getByRole("button", { name: "Impostazioni", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta backup pre-F02" }).click();
  expect((await download).suggestedFilename()).toBe("borgo-pre-F02-v1.json");
  const before = await saved(page);
  await page.reload();
  const after = await saved(page);
  expect(after.coins).toBeCloseTo(before.coins, 0);
  expect(after.creatures).toEqual(before.creatures);
  await page.clock.fastForward(1000);
  const future = await saved(page);
  // Autosave every5s: explicit export reconciles/saves current state before reading it.
  await closeManage(page);
  await page.getByRole("button", { name: "Impostazioni", exact: true }).click();
  await page.getByRole("button", { name: "Esporta partita JSON" }).click();
  expect((await saved(page)).economyVersion).toBe(2);
  expect(baseRate(future, "orto")).toBeGreaterThan(
    legacy.baseRate(expected, "orto") * 4,
  );
  for (let i = 0; i < 2; i++) {
    await page.getByLabel("Oppure incolla un salvataggio JSON").fill(raw);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Valida e importa" }).click();
    expect((await saved(page)).coins).toBeCloseTo(
      legacy.advance(s, epoch + 1000).coins,
      6,
    );
  }
});
test("F02: backup negato conserva v1 originale, partita in memoria e versione futura recuperabile", async ({
  page,
}) => {
  const old = legacy.createState(epoch - 3600_000),
    raw = JSON.stringify(old);
  await page.clock.install({ time: new Date(epoch) });
  await page.addInitScript(
    ({ key, raw, backup }) => {
      localStorage.setItem(key, raw);
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === backup) throw new DOMException("Quota", "QuotaExceededError");
        return original.call(this, k, v);
      };
    },
    { key: SAVE_KEY, raw, backup: BACKUP_KEY },
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Backup pre-F02 disponibile in memoria",
  );
  await page.getByRole("button", { name: /Incoraggia Momo/ }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe(raw);
  await closeManage(page);
  await page.getByRole("button", { name: "Impostazioni", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Esporta backup pre-F02" }),
  ).toBeEnabled();
  await page
    .getByLabel("Oppure incolla un salvataggio JSON")
    .fill(JSON.stringify({ ...createState(epoch), economyVersion: 999 }));
  await page.getByRole("button", { name: "Valida e importa" }).click();
  await expect(page.locator(".settings-result")).toContainText(
    "Versione economica sconosciuta",
  );
});
test("F02: controlli mobile44px, toolbar sticky e assenza overflow", async ({
  page,
}, info) => {
  await seed(page, JSON.stringify(L8()));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const controls = await page
    .locator(".activity-list button")
    .evaluateAll((es) =>
      es.map((e) => ({
        name: e.textContent,
        height: e.getBoundingClientRect().height,
        width: e.getBoundingClientRect().width,
      })),
    );
  expect(controls.every((c) => c.height >= 44 && c.width >= 44)).toBe(true);
  if (info.project.name !== "desktop") {
    await page.getByTestId("activity-laboratorio").scrollIntoViewIfNeeded();
    const toolbar = await page
      .locator(".purchase-toolbar")
      .last()
      .boundingBox();
    expect(toolbar!.y).toBeGreaterThanOrEqual(-1);
    expect(toolbar!.y).toBeLessThan(260);
  }
});
