import { activities, balance, flow, type PurchaseMode } from "../content";
import manifest from "../content/art-manifest.json";
import {
  assigned,
  baseRate,
  nextActivityMilestone,
  quoteUpgrade,
  rate,
  type State,
} from "../core/engine";
import { game } from "./store";
import { Art } from "../scene/Scene";
import { compact, fmt } from "./format";
const art = manifest.activities as Record<
  string,
  { src: string; fallbackSrc: string }
>;
const shortNames: Record<string, string> = {
  orto: "Orto luminoso",
  vivaio: "Vivaio delle gemme",
  mulino: "Mulino di nuvole",
  laboratorio: "Laboratorio delle lucciole",
};
export function purchaseReason(state: State, id: string, mode: PurchaseMode) {
  const a = activities.find((a) => a.id === id)!;
  if (!state.activities[id])
    return a.requiresProject &&
      !state.completedProjects.includes(a.requiresProject)
      ? `Completa ${a.requiresProject === "sentiero" ? "il Sentiero" : "il Ponte"}`
      : state.coins < a.purchaseCost
        ? `Mancano ${fmt(Math.ceil(a.purchaseCost - state.coins), 0)} monete`
        : "";
  if (state.activities[id] === balance.activityMaxLevel)
    return "Livello massimo raggiunto";
  const q = quoteUpgrade(state, id, mode);
  return q.affordable
    ? ""
    : `Mancano ${fmt(Math.ceil((q.count ? q.cost : quoteUpgrade(state, id, "1").cost) - state.coins), 0)} monete`;
}
export function UpgradeAction({
  state,
  id,
  mode,
  disabled,
  preview,
}: {
  state: State;
  id: string;
  mode: PurchaseMode;
  disabled: boolean;
  preview: (id: string) => void;
}) {
  const a = activities.find((a) => a.id === id)!,
    level = state.activities[id],
    q = quoteUpgrade(state, id, mode);
  const locked =
      !!a.requiresProject &&
      !state.completedProjects.includes(a.requiresProject),
    cap = level === balance.activityMaxLevel;
  const quick =
    level > 0 &&
    !cap &&
    mode !== "1" &&
    !q.affordable &&
    quoteUpgrade(state, id, "1").affordable;
  return (
    <div className="purchase-action">
      <div className="purchase-buttons">
        {locked ? (
          <span className="unlock-label">
            {purchaseReason(state, id, mode)}
          </span>
        ) : quick ? (
          <button
            className="buy-button quick-buy"
            disabled={disabled}
            onClick={() =>
              game.dispatch({ type: "upgradeActivity", id, mode: "1" })
            }
            aria-label={`Puoi comprare +1 ${a.name}: ${fmt(quoteUpgrade(state, id, "1").cost, 0)} monete`}
          >
            <span>Puoi comprare +1</span>
            <strong>{fmt(quoteUpgrade(state, id, "1").cost, 0)} monete</strong>
          </button>
        ) : (
          <button
            className="buy-button"
            disabled={
              disabled ||
              cap ||
              (level ? !q.affordable : state.coins < a.purchaseCost)
            }
            onClick={() =>
              game.dispatch(
                level
                  ? { type: "upgradeActivity", id, mode }
                  : { type: "buyActivity", id },
              )
            }
            aria-label={
              cap
                ? `${a.name}: Massimo`
                : level
                  ? `Migliora ${a.name}: L${level} → L${q.target}, ${q.count} livelli, ${fmt(q.cost, 0)} monete`
                  : `Costruisci ${a.name}: ${fmt(a.purchaseCost, 0)} monete`
            }
          >
            <span>
              {cap
                ? "Massimo L50"
                : level
                  ? `L${level} → L${q.target}`
                  : "Costruisci"}
            </span>
            <strong>
              {cap
                ? ""
                : !level
                  ? `${fmt(a.purchaseCost, 0)} monete`
                  : q.count
                    ? `${fmt(q.cost, 0)} monete`
                    : "MAX non disponibile"}
            </strong>
          </button>
        )}
        <button
          className="preview-button secondary"
          aria-label={`Anteprima ${a.name}`}
          onClick={() => preview(id)}
        >
          <span aria-hidden="true">↗</span>
          <span className="sr-only">Anteprima</span>
        </button>
      </div>
      {!locked && !cap && purchaseReason(state, id, mode) && (
        <span className="disabled-reason">
          {quick ? "Blocco selezionato: " : ""}
          {purchaseReason(state, id, mode)}
        </span>
      )}
    </div>
  );
}
export function ActivityList({
  state,
  mode,
  disabled,
  select,
  selected,
  preview,
  feedback,
}: {
  state: State;
  mode: PurchaseMode;
  disabled: boolean;
  select: (id: string) => void;
  selected: string;
  preview: (id: string) => void;
  feedback: Record<string, string>;
}) {
  return (
    <section className="activity-list" aria-label="Attività del borgo">
      {activities.map((a) => {
        const level = state.activities[a.id],
          worker = assigned(state, a.id),
          next = nextActivityMilestone(level);
        return (
          <article
            key={a.id}
            data-testid={`activity-${a.id}`}
            className={`activity-row ${level ? "owned" : "future"} ${selected === a.id ? "selected-row" : ""}`}
          >
            <div className="row-identity">
              <button
                className="activity-select"
                aria-label={`Seleziona dalla lista ${a.name}`}
                aria-pressed={selected === a.id}
                onClick={() => select(a.id)}
              >
                <Art asset={art[a.id]} />
                <span>
                  <strong>{shortNames[a.id]}</strong>
                  <span>
                    {level
                      ? `L${level}${worker ? ` · ${worker[0][0].toUpperCase() + worker[0].slice(1)}` : ""}`
                      : "Da costruire"}
                  </span>
                </span>
              </button>
              <div
                className="row-income"
                title={`${fmt(rate(state, a.id), 6)} monete al secondo`}
              >
                <strong>{compact(rate(state, a.id))}</strong>
                <span>monete/s</span>
              </div>
            </div>
            <div className="row-command">
              <div className="row-target">
                {purchaseReason(state, a.id, mode) &&
                !(
                  a.requiresProject &&
                  !state.completedProjects.includes(a.requiresProject)
                ) ? (
                  <span>{purchaseReason(state, a.id, mode)}</span>
                ) : (
                  <>
                    {level ? (
                      next ? (
                        <>
                          <span>
                            Prossimo L{next.level} · ×{next.factor}
                          </span>
                          <progress
                            value={level}
                            max={next.level}
                            aria-label={`Livelli verso L${next.level} ${a.name}`}
                          />
                        </>
                      ) : (
                        <span>Tutti i traguardi raggiunti</span>
                      )
                    ) : (
                      <span>{a.baseCoinsPerSecond} monete/s base</span>
                    )}
                  </>
                )}
              </div>
              <UpgradeAction
                state={state}
                id={a.id}
                mode={mode}
                disabled={disabled}
                preview={preview}
              />
            </div>
            <p
              className="row-feedback"
              role="status"
              title={feedback[a.id] ?? ""}
            >
              {feedback[a.id] ?? ""}
            </p>
          </article>
        );
      })}
    </section>
  );
}
export function PreviewContent({
  state,
  id,
  mode,
  feedback,
}: {
  state: State;
  id: string;
  mode: PurchaseMode;
  feedback?: string;
}) {
  const q = quoteUpgrade(state, id, mode),
    next = nextActivityMilestone(state.activities[id]);
  const a = activities.find((a) => a.id === id)!;
  return (
    <section className="quote-preview">
      {state.activities[id] > 0 ? (
        <>
          <p className="preview-eyebrow">
            Produzione passiva · senza bonus temporanei
          </p>
          <div className="preview-number">
            <strong>{fmt(q.beforeRate, 3)}</strong>
            <span aria-hidden="true">→</span>
            <strong>{fmt(q.afterRate, 3)}</strong>
            <span>monete/s</span>
          </div>
          <dl>
            <div>
              <dt>Acquisto</dt>
              <dd>
                L{q.from} → L{q.target} · {q.count} livelli
              </dd>
            </div>
            <div>
              <dt>Costo esatto</dt>
              <dd>{fmt(q.cost, 0)} monete</dd>
            </div>
            <div>
              <dt>Tasso attuale con bonus</dt>
              <dd>{fmt(rate(state, id), 3)} monete/s</dd>
            </div>
          </dl>
          {q.milestones.map((m) => (
            <p key={m.level} className="milestone-chip">
              Traguardo L{m.level} ×{m.factor} incluso
            </p>
          ))}
          {next && (
            <p>
              Prossimo traguardo: L{next.level} · produzione ×{next.factor}. Per
              raggiungerlo: {fmt(quoteUpgrade(state, id, "next").cost, 0)}{" "}
              monete.
            </p>
          )}
          <p>
            Traguardi raggiunti:{" "}
            {flow.activityMilestones
              .filter((m) => m.level <= q.from)
              .map((m) => `L${m.level} ×${m.factor}`)
              .join(", ") || "nessuno"}
            . I bonus sono già compresi nei tassi.
          </p>
        </>
      ) : (
        <>
          <p>
            Costruzione: <strong>{fmt(a.purchaseCost, 0)} monete</strong>
          </p>
          <p>
            Produzione base: {fmt(a.baseCoinsPerSecond)} monete/s, anche senza
            creatura.
          </p>
        </>
      )}
      {purchaseReason(state, id, mode) && (
        <p className="preview-reason">{purchaseReason(state, id, mode)}</p>
      )}
      {feedback && (
        <p className="preview-feedback">Ultimo acquisto: {feedback}</p>
      )}
    </section>
  );
}
