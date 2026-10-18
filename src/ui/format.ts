export const fmt = (n: number, digits = 2) =>
  n.toLocaleString("it-IT", { maximumFractionDigits: digits });
export const compact = (n: number) =>
  n >= 1e6
    ? `${fmt(n / 1e6, 1)}M`
    : n >= 1e4
      ? `${fmt(n / 1000, 1)}k`
      : fmt(n, 1);
export const duration = (s: number) =>
  s >= 3600
    ? `${fmt(s / 3600, 1)}h`
    : s >= 60
      ? `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`
      : `${Math.ceil(s)}s`;
