import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
await page.addInitScript("globalThis.__name=(fn)=>fn");
await page.goto("http://127.0.0.1:5173");
await page.getByRole("button", { name: "Gestisci quattro attività" }).click();
await page.evaluate(() => {
  const root = document.createElement("div");
  root.className = "prototype";
  const label = document.createElement("p");
  label.className = "prototype-label";
  label.textContent = "PROTOTIPO SCARTATO · quattro righe permanenti";
  root.append(label);
  const clone = (selector: string) =>
    document.querySelector(selector)!.cloneNode(true);
  root.append(clone(".topbar"), clone(".scene-column"));
  const ops = document.createElement("div");
  ops.className = "prototype-operations";
  for (const child of document.querySelector(
    ".management-drawer .dialog-scroll",
  )!.children)
    ops.append(child.cloneNode(true));
  root.append(ops, clone(".navigation"));
  document.body.append(root);
});
await page.addStyleTag({
  content:
    "#root{display:none}.prototype{max-width:390px;margin:auto}.prototype-label{padding:10px;background:#284e3b;color:#fff;font-size:14px}.prototype .scene-column{height:400px;max-height:none;margin:8px}.prototype .scene{height:400px}.prototype-operations{display:flex;flex-direction:column;gap:8px;padding:8px}.prototype .navigation{position:static}",
});
const measurements = await page.evaluate(() => ({
  viewportHeight: innerHeight,
  documentHeight: document.documentElement.scrollHeight,
  sceneHeight: document
    .querySelector(".prototype .scene")!
    .getBoundingClientRect().height,
  prototypeOnly: true,
}));
await page.screenshot({
  path: "docs/screenshots/f03/prototype-mobile390-four-rows.png",
  fullPage: true,
  animations: "disabled",
});
writeFileSync(
  "docs/f03-layout-prototype.json",
  JSON.stringify(measurements, null, 2) + "\n",
);
console.log(measurements);
await browser.close();
