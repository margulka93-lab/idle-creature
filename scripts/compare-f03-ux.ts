import { chromium, type Page } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { createState, command, advance } from "../src/core/engine";
import { SAVE_KEY } from "../src/persistence/save";
const epoch = 1_800_000_000_000;
const browser = await chromium.launch();
const results = [];
for (const [profile, width, height] of [
  ["desktop", 1440, 900],
  ["mobile390", 390, 844],
  ["mobile360", 360, 800],
] as const) {
  for (const version of ["F02", "F03"])
    for (const scenario of [
      "incoraggia",
      "primo-livello",
      "quantita-10",
      "trova-progetto",
      "confronta-quattro",
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 500,
        hasTouch: width < 500,
      });
      const page = await context.newPage();
      await page.clock.install({ time: new Date(epoch - 1000) });
      await page.clock.pauseAt(new Date(epoch));
      await page.addInitScript(
        ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
        { key: SAVE_KEY, state: createState(epoch) },
      );
      await page.goto(
        version === "F02" ? "http://127.0.0.1:5174" : "http://127.0.0.1:5173",
      );
      await page.getByRole("button", { name: /Incoraggia Momo/ }).waitFor();
      await page.evaluate(() => {
        const data = { events: [] as { target: string; top: number }[] };
        (window as any).uxProbe = data;
        document.addEventListener(
          "scroll",
          (e) => {
            const el =
              e.target === document
                ? document.scrollingElement!
                : (e.target as HTMLElement);
            data.events.push({
              target: el.className || "document",
              top: el.scrollTop,
            });
          },
          true,
        );
      });
      let taps = 0;
      const click = async (locator: ReturnType<Page["locator"]>) => {
        if (width < 500) await locator.tap();
        else await locator.click();
        taps++;
      };
      if (scenario === "incoraggia")
        await click(page.getByRole("button", { name: /Incoraggia Momo/ }));
      if (scenario === "primo-livello") {
        if (version === "F02") {
          await click(page.getByRole("button", { name: "+1", exact: true }));
          await click(
            page
              .getByTestId("activity-orto")
              .getByRole("button", { name: /^Migliora / }),
          );
        } else
          await click(
            page
              .locator(".mobile-dock:visible,.operations:visible")
              .getByRole("button", { name: /^Puoi comprare \+1/ }),
          );
      }
      if (scenario === "quantita-10")
        await click(page.getByRole("button", { name: "+10", exact: true }));
      if (scenario === "trova-progetto") {
        if (version === "F02")
          await page.locator(".next-project").scrollIntoViewIfNeeded();
        else
          await click(
            page.getByRole("button", { name: /^Prossimo progetto:/ }),
          );
      }
      if (scenario === "confronta-quattro") {
        if (version === "F03" && width < 500)
          await click(
            page.getByRole("button", { name: "Gestisci quattro attività" }),
          );
        await page.getByTestId("activity-laboratorio").scrollIntoViewIfNeeded();
      }
      await page.waitForTimeout(100);
      const data = await page.evaluate(() => ({
        ...(window as any).uxProbe,
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: innerHeight,
      }));
      results.push({ profile, version, scenario, taps, ...data });
      await context.close();
    }
}
mkdirSync("docs/recordings", { recursive: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  recordVideo: { dir: "docs/recordings", size: { width: 390, height: 844 } },
});
const page = await context.newPage();
let state = createState(epoch - 180_000);
state.coins = 500;
state.lifetimeCoins = 500;
state = command(
  state,
  { type: "buyActivity", id: "vivaio" },
  state.lastSimulatedAt,
).state;
state = advance(state, epoch);
await page.clock.install({ time: new Date(epoch - 1000) });
await page.clock.pauseAt(new Date(epoch));
await page.addInitScript(
  ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
  { key: SAVE_KEY, state },
);
await page.goto("http://127.0.0.1:5173");
await page.waitForTimeout(1500);
const a = (await page
    .getByRole("button", { name: "Seleziona Momo", exact: true })
    .boundingBox())!,
  b = (await page
    .getByRole("button", { name: "Seleziona Nibi", exact: true })
    .boundingBox())!;
const cdp = await context.newCDPSession(page);
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 }],
});
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchMove",
  touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 }],
});
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await page.waitForTimeout(1200);
await page
  .getByRole("button", { name: "Raccogli prodotto Orto luminoso", exact: true })
  .tap();
await page
  .getByTestId("selected-actions")
  .getByRole("button", { name: /^Migliora / })
  .tap();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Gestisci quattro attività" }).tap();
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "MAX", exact: true }).last().tap();
await page.waitForTimeout(900);
await page
  .getByRole("button", { name: "Chiudi Gestione del borgo", exact: true })
  .tap();
await page.getByRole("button", { name: /^Prossimo progetto:/ }).tap();
await page.waitForTimeout(1600);
await page
  .getByRole("button", { name: "Chiudi Prossimo progetto", exact: true })
  .tap();
await page.waitForTimeout(800);
const video = page.video()!;
await context.close();
await video.saveAs("docs/recordings/f03-mobile.webm");
const original = await video.path();
if (!original.endsWith("f03-mobile.webm")) {
  const { unlinkSync } = await import("node:fs");
  unlinkSync(original);
}
await browser.close();
writeFileSync(
  "docs/f03-ux-comparison.json",
  JSON.stringify(
    {
      baselineCommit: "ea31c4e",
      method:
        "Real Chromium, same new-game fixture per isolated task, controlled clock. Taps are executed inputs. Scroll events are browser automatic scrollIntoView movements, NOT estimates of human swipes or completion times. F02 runs at5174, F03 at5173.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.table(
  results.map(({ events, ...r }) => ({
    ...r,
    scrollEvents: events.length,
    scrollPositions: events.map((e: any) => e.top).join(","),
  })),
);
