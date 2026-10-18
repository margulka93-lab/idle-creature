import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const file = "docs/flow-simulation-results.json",
  baseline = execFileSync("git", ["show", "ea31c4e:" + file]);
// The historical F02 report is restored byte for byte after the replay.
writeFileSync(file, baseline);
let replay;
try {
  execFileSync(process.execPath, [
    "node_modules/tsx/dist/cli.mjs",
    "scripts/flow-simulate.ts",
  ]);
  replay = JSON.parse(readFileSync(file, "utf8"));
  const expected = JSON.parse(baseline);
  delete replay.generatedAt;
  delete expected.generatedAt;
  assert.deepEqual(replay, expected);
} finally {
  writeFileSync(file, baseline);
}
const paths = [
  "src/core/engine.ts",
  "src/core/legacy-v1.ts",
  "src/persistence/save.ts",
  "src/content/index.ts",
  "design/balance.v1.json",
  "design/flow.v2.json",
];
const hash = (raw) =>
  createHash("sha256")
    .update(raw.toString().replaceAll("\r\n", "\n"))
    .digest("hex");
const unchanged = paths.map((path) => {
  const before = hash(execFileSync("git", ["show", "ea31c4e:" + path])),
    after = hash(readFileSync(path));
  assert.equal(after, before, path + " changed");
  return { path, sha256: after, unchanged: true };
});
writeFileSync(
  "docs/f03-economy-regression.json",
  JSON.stringify(
    {
      baselineCommit: "ea31c4e",
      comparison:
        "All eight simulation runs, snapshots, events and contrasts equal F02, ignoring generatedAt only",
      runs: replay.runs.length,
      equal: true,
      unchanged,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "F03: eight simulation runs identical to F02; six economic/persistence authorities unchanged.",
);
