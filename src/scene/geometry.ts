export type Point = { x: number; y: number };
export type Rect = { left: number; right: number; top: number; bottom: number };
/** Slab intersection catches every hitbox even when a swipe has only two samples. */
export function intersects(a: Point, b: Point, r: Rect): boolean {
  let lo = 0,
    hi = 1;
  for (const [start, delta, min, max] of [
    [a.x, b.x - a.x, r.left, r.right],
    [a.y, b.y - a.y, r.top, r.bottom],
  ]) {
    if (Math.abs(delta) < 1e-10) {
      if (start < min || start > max) return false;
    } else {
      const u = (min - start) / delta,
        v = (max - start) / delta;
      lo = Math.max(lo, Math.min(u, v));
      hi = Math.min(hi, Math.max(u, v));
      if (lo > hi) return false;
    }
  }
  return true;
}
