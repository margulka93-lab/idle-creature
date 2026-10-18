import { useState } from "react";
import {
  defaultPurchaseMode,
  purchaseModes,
  type PurchaseMode,
} from "../content";
export const MODE_KEY = "borgo-creature.purchase-mode.v1";
export const modeLabels: Record<PurchaseMode, string> = {
  "1": "+1",
  "10": "+10",
  next: "PROSSIMO",
  max: "MAX",
};
export function usePurchaseMode() {
  const [mode, setMode] = useState<PurchaseMode>(() => {
    try {
      const value = localStorage.getItem(MODE_KEY);
      return purchaseModes.includes(value as PurchaseMode)
        ? (value as PurchaseMode)
        : defaultPurchaseMode;
    } catch {
      return defaultPurchaseMode;
    }
  });
  return [
    mode,
    (value: PurchaseMode) => {
      setMode(value);
      try {
        localStorage.setItem(MODE_KEY, value);
      } catch {
        /* Optional UI preference; no effect on save. */
      }
    },
  ] as const;
}
export function ModeSelector({
  mode,
  change,
}: {
  mode: PurchaseMode;
  change: (mode: PurchaseMode) => void;
}) {
  return (
    <div
      className="purchase-toolbar"
      role="group"
      aria-label="Quantità acquisto"
    >
      {purchaseModes.map((m) => (
        <button key={m} aria-pressed={mode === m} onClick={() => change(m)}>
          {modeLabels[m]}
        </button>
      ))}
    </div>
  );
}
