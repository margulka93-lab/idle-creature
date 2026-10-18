import { useState } from "react";
import {
  activities,
  creatures,
  balance,
  defaultPurchaseMode,
  purchaseModes,
  flow,
  type PurchaseMode,
} from "../content";
import manifest from "../content/art-manifest.json";
import {
  assigned,
  baseRate,
  rate,
  nextActivityMilestone,
  quoteUpgrade,
  type State,
} from "../core/engine";
import { game } from "./store";
const MODE_KEY = "borgo-creature.purchase-mode.v1";
const labels: Record<PurchaseMode, string> = {
  "1": "+1",
  "10": "+10",
  next: "PROSSIMO",
  max: "MAX",
};
const fmt = (n: number, digits = 2) =>
  n.toLocaleString("it-IT", { maximumFractionDigits: digits });
const short = (n: number) =>
  n >= 1e6 ? `${fmt(n / 1e6, 1)}M` : n >= 1e4 ? `${fmt(n / 1e3, 1)}k` : fmt(n);
const art = manifest.activities as Record<string, { src: string }>;
export function ActivityList({
  state,
  disabled,
  onDetails,
  feedback,
}: {
  state: State;
  disabled: boolean;
  onDetails: (id: string) => void;
  feedback: Record<string, string>;
}) {
  const [mode, setMode] = useState<PurchaseMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      return purchaseModes.includes(saved as PurchaseMode)
        ? (saved as PurchaseMode)
        : defaultPurchaseMode;
    } catch {
      return defaultPurchaseMode;
    }
  });
  return (
    <section className="activity-list" aria-label="Attività del borgo">
      <div className="purchase-toolbar">
        <strong>Le tue attività</strong>
        <div role="group" aria-label="Quantità acquisto">
          {purchaseModes.map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                try {
                  localStorage.setItem(MODE_KEY, m);
                } catch {
                  /* UI preference is optional. */
                }
              }}
            >
              {labels[m]}
            </button>
          ))}
        </div>
      </div>
      {activities.map((a) => {
        const level = state.activities[a.id],
          q = quoteUpgrade(state, a.id, mode),
          next = nextActivityMilestone(level),
          worker = assigned(state, a.id);
        const locked =
          !!a.requiresProject &&
          !state.completedProjects.includes(a.requiresProject);
        const currentRate = rate(state, a.id),
          passive = baseRate(state, a.id),
          capped = level === balance.activityMaxLevel;
        const nextQuote = quoteUpgrade(state, a.id, "next");
        const reached = flow.activityMilestones.filter((m) => m.level <= level);
        return (
          <article
            key={a.id}
            className={`activity-row ${locked ? "locked" : ""}`}
            data-testid={`activity-${a.id}`}
          >
            <div className="activity-heading">
              <img src={art[a.id].src} alt="" />
              <div>
                <h3>{a.name}</h3>
                <span>
                  {level
                    ? `L${level} · ${worker ? creatures.find((c) => c.id === worker[0])!.name : "Posto libero"}`
                    : locked
                      ? `Richiede ${a.requiresProject === "sentiero" ? "il Sentiero" : "il Ponte"}`
                      : "Pronta da costruire"}
                </span>
              </div>
              <button
                className="row-details"
                aria-label={`Dettagli ${a.name}`}
                onClick={() => onDetails(a.id)}
              >
                Dettagli
              </button>
            </div>
            {level > 0 ? (
              <>
                <div className="row-rates">
                  <strong title={`${fmt(passive, 6)} monete/s passive`}>
                    {short(passive)} <small>monete/s passive</small>
                  </strong>
                  {Math.abs(currentRate - passive) > 1e-8 && (
                    <span>Attive: {short(currentRate)}/s</span>
                  )}
                </div>
                {next ? (
                  <div className="row-milestone">
                    <span>
                      Prossimo traguardo: L{next.level} · produzione ×
                      {next.factor}
                    </span>
                    <progress
                      max={next.level}
                      value={level}
                      aria-label={`Livelli verso L${next.level} ${a.name}`}
                    />
                    <small>
                      L{level}/{next.level} · {fmt(nextQuote.cost, 0)} monete ·{" "}
                      {fmt(nextQuote.beforeRate)} → {fmt(nextQuote.afterRate)}/s
                    </small>
                  </div>
                ) : (
                  <p className="row-milestone">
                    Tutti i traguardi raggiunti · produzione ×
                    {reached.reduce((n, m) => n * m.factor, 1)}
                  </p>
                )}
                <button
                  className="bulk-buy"
                  disabled={disabled || capped || !q.affordable}
                  onClick={() =>
                    game.dispatch({ type: "upgradeActivity", id: a.id, mode })
                  }
                  aria-label={
                    capped
                      ? `${a.name}: Massimo`
                      : `Migliora ${a.name}: L${q.from} → L${q.target}, ${q.count} livelli, ${fmt(q.cost, 0)} monete, ${fmt(q.beforeRate, 6)} → ${fmt(q.afterRate, 6)} monete/s passive`
                  }
                >
                  <span>
                    {capped
                      ? "Massimo"
                      : q.count
                        ? `L${q.from} → L${q.target} · +${q.count} ${q.count === 1 ? "livello" : "livelli"}`
                        : "Nessun livello sostenibile"}
                  </span>
                  <strong>{capped ? "L50" : `${fmt(q.cost, 0)} monete`}</strong>
                  {!capped && (
                    <small>
                      {fmt(q.beforeRate)} → {fmt(q.afterRate)}/s passive
                    </small>
                  )}
                </button>
                {!capped && q.milestones.length > 0 && (
                  <small className="quote-benefit">
                    {`Traguardo ${q.milestones.map((m) => `L${m.level} ×${m.factor}`).join(" + ")} incluso`}
                  </small>
                )}
                {!q.affordable &&
                  !capped &&
                  mode !== "1" &&
                  quoteUpgrade(state, a.id, "1").affordable && (
                    <small className="afford-hint">
                      Puoi già acquistare +1: scegli la modalità +1.
                    </small>
                  )}
                {feedback[a.id] && (
                  <p className="row-feedback" role="status">
                    {feedback[a.id]}
                  </p>
                )}
                <div className="row-actions">
                  {worker && (
                    <button
                      className="secondary"
                      disabled={disabled}
                      onClick={() =>
                        game.dispatch({ type: "encourage", id: worker[0] })
                      }
                    >
                      Incoraggia{" "}
                      {creatures.find((c) => c.id === worker[0])!.name}
                      <small>
                        {worker[1].encouragedUntil > state.lastSimulatedAt
                          ? `+50% · ${Math.ceil((worker[1].encouragedUntil - state.lastSimulatedAt) / 1000)}s`
                          : "+50%"}
                      </small>
                    </button>
                  )}
                  <button
                    className="secondary"
                    disabled={disabled || !state.specialProducts[a.id].ready}
                    onClick={() =>
                      game.dispatch({ type: "collectProduct", id: a.id })
                    }
                    aria-label={`Raccogli prodotto dalla lista ${a.name}`}
                  >
                    {state.specialProducts[a.id].ready
                      ? "Raccogli prodotto"
                      : `Prodotto · ${Math.ceil(balance.specialProduct.secondsToReady - state.specialProducts[a.id].secondsAccumulated)}s`}
                  </button>
                </div>
                {reached.length > 0 && (
                  <details className="reached-milestones">
                    <summary>
                      Traguardi raggiunti:{" "}
                      {reached.map((m) => `L${m.level}`).join(" · ")}
                    </summary>
                    {reached.map((m) => (
                      <span key={m.level}>
                        L{m.level}: ×{m.factor} produzione{" "}
                      </span>
                    ))}
                  </details>
                )}
              </>
            ) : (
              <button
                className="bulk-buy"
                disabled={disabled || locked || state.coins < a.purchaseCost}
                onClick={() => game.dispatch({ type: "buyActivity", id: a.id })}
                aria-label={`Costruisci ${a.name}: ${fmt(a.purchaseCost, 0)} monete`}
              >
                <span>Costruisci · {a.baseCoinsPerSecond}/s base</span>
                <strong>{fmt(a.purchaseCost, 0)} monete</strong>
              </button>
            )}
          </article>
        );
      })}
    </section>
  );
}
