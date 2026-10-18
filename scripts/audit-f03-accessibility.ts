import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const b = await chromium.launch();
const results = [];
for (const width of [1440, 390, 360]) {
  const p = await b.newPage({
    viewport: { width, height: width === 1440 ? 900 : 844 },
  });
  await p.addInitScript("globalThis.__name=(fn)=>fn");
  await p.goto("http://127.0.0.1:5173");
  await p
    .getByRole("button", { name: "Incoraggia Momo", exact: true })
    .waitFor();
  await p.waitForFunction(
    () => !document.querySelector<HTMLButtonElement>(".pet-command")?.disabled,
  );
  await p.waitForTimeout(350);
  const rows = await p.evaluate(() => {
    function rgba(s: string) {
      const a = s.match(/[\d.]+/g)!.map(Number);
      return [a[0], a[1], a[2], a[3] ?? 1];
    }
    function lum(c: number[]) {
      return c
        .slice(0, 3)
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    }
    function bg(el: Element | null): number[] {
      if (!el) return [255, 255, 255, 1];
      const c = rgba(getComputedStyle(el).backgroundColor),
        p = bg(el.parentElement);
      return c
        .slice(0, 3)
        .map((v, i) => v * c[3] + p[i] * (1 - c[3]))
        .concat(1);
    }
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      ),
      out = [];
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement!;
      if (
        !node.textContent?.trim() ||
        !el.getClientRects().length ||
        el.closest("svg,.sr-only,.scene,.brand-mark,.coin,.crystal")
      )
        continue;
      const style = getComputedStyle(el),
        color = rgba(style.color),
        back = bg(el),
        a = lum(color),
        b = lum(back),
        ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      out.push({
        text: node.textContent.trim(),
        selector: el.className,
        color: style.color,
        bg: back.slice(0, 3),
        font: parseFloat(style.fontSize),
        ratio: Number(ratio.toFixed(2)),
      });
    }
    return out;
  });
  results.push({
    width,
    checks: rows,
    failures: rows.filter((r) => r.ratio < 4.5 || r.font < 14),
  });
  await p.close();
}
await b.close();
writeFileSync(
  "docs/f03-accessibility-audit.json",
  JSON.stringify(
    {
      method:
        "Computed foreground/background, opaque UI outside illustrated scene; minimum14px and normal-text contrast4.5:1. Not a full WCAG certification.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    results.map(({ width, failures }) => ({ width, failures })),
    null,
    2,
  ),
);
