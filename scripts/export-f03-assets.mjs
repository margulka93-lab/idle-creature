import fs from "node:fs";
import sharp from "sharp";
const source = "docs/art/f03/masters",
  target = "public/assets/f03";
fs.mkdirSync(target, { recursive: true });
const audit = [];
for (const id of [
  "background",
  "orto",
  "vivaio",
  "mulino",
  "laboratorio",
  "momo",
  "nibi",
  "tula",
]) {
  const path = `${source}/${id}.png`,
    meta = await sharp(path).metadata(),
    stats = await sharp(path).stats();
  if (
    id !== "background" &&
    (!meta.hasAlpha ||
      stats.channels[3].min !== 0 ||
      stats.channels[3].max !== 255)
  )
    throw Error(`${id}: missing real transparency`);
  const size =
    id === "background"
      ? 1448
      : ["momo", "nibi", "tula"].includes(id)
        ? 512
        : 768;
  const output = await sharp(path)
    .resize({ width: size, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(`${target}/${id}.webp`);
  audit.push({
    id,
    source: path,
    width: meta.width,
    height: meta.height,
    alpha: !!meta.hasAlpha,
    alphaMinimum: meta.hasAlpha ? stats.channels[3].min : null,
    exportWidth: output.width,
    exportHeight: output.height,
    exportBytes: output.size,
  });
}
fs.writeFileSync(
  "docs/art/f03/asset-audit.json",
  JSON.stringify(audit, null, 2) + "\n",
);
console.table(audit);
