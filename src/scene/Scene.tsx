import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import manifest from "../content/art-manifest.json";
import { activities, creatures } from "../content";
import { rate, type State } from "../core/engine";
import { game } from "../ui/store";
import { intersects, type Point } from "./geometry";
const placements = manifest.activities as Record<
  string,
  { src: string; x: number; y: number }
>;
export const creatureArt = manifest.creatures as Record<
  string,
  { src: string }
>;
const number = (n: number) =>
  n.toLocaleString("it-IT", { maximumFractionDigits: 1 });
export function Scene({
  state,
  selected,
  select,
  disabled,
}: {
  state: State;
  selected: string;
  select: (id: string) => void;
  disabled: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    start: Point;
    last: Point;
    dragging: boolean;
    touched: Set<string>;
  } | null>(null);
  const suppressClick = useRef(false);
  const move = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId || disabled) return;
    const point = { x: e.clientX, y: e.clientY };
    if (
      !g.dragging &&
      Math.hypot(point.x - g.start.x, point.y - g.start.y) >= 8
    ) {
      g.dragging = true;
      suppressClick.current = true;
      root.current?.setPointerCapture(e.pointerId);
    }
    if (g.dragging) {
      root.current
        ?.querySelectorAll<HTMLElement>("[data-gesture]")
        .forEach((el) => {
          const key = el.dataset.gesture!;
          if (
            !g.touched.has(key) &&
            intersects(g.last, point, el.getBoundingClientRect())
          ) {
            g.touched.add(key);
            const [type, id] = key.split(":");
            game.dispatch(
              type === "creature"
                ? { type: "encourage", id }
                : { type: "collectProduct", id },
            );
          }
        });
      g.last = point;
    }
  };
  return (
    <div
      className="scene"
      ref={root}
      data-testid="scene"
      aria-label="Quartiere delle creature"
      style={{ backgroundImage: `url(${manifest.background})` }}
      onPointerDown={(e) => {
        if (disabled || !e.isPrimary || e.button !== 0 || gesture.current)
          return;
        suppressClick.current = false;
        gesture.current = {
          id: e.pointerId,
          start: { x: e.clientX, y: e.clientY },
          last: { x: e.clientX, y: e.clientY },
          dragging: false,
          touched: new Set(),
        };
      }}
      onPointerMove={move}
      onPointerUp={(e) => {
        if (gesture.current?.id !== e.pointerId) return;
        move(e);
        if (gesture.current && !gesture.current.dragging) {
          const target = (e.target as HTMLElement).closest<HTMLElement>(
            '[data-select], [data-gesture^="product:"]',
          );
          if (target?.dataset.select) {
            select(target.dataset.select);
            suppressClick.current = true;
          } else if (target?.dataset.gesture) {
            game.dispatch({
              type: "collectProduct",
              id: target.dataset.gesture.split(":")[1],
            });
            suppressClick.current = true;
          }
        }
        gesture.current = null;
        if (root.current?.hasPointerCapture(e.pointerId))
          root.current.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={(e) => {
        if (gesture.current?.id === e.pointerId) {
          gesture.current = null;
          suppressClick.current = false;
        }
      }}
      onLostPointerCapture={(e) => {
        if (e.target === root.current && gesture.current?.id === e.pointerId)
          gesture.current = null;
      }}
      onClickCapture={(e) => {
        if (suppressClick.current && e.detail !== 0) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="scene-title">
        <span>LE TERRAZZE VERDI</span>
        <small>Un piccolo mondo, un passo alla volta</small>
      </div>
      {activities.map((a) => {
        const asset = placements[a.id],
          owned = state.activities[a.id] > 0;
        const locked =
          !!a.requiresProject &&
          !state.completedProjects.includes(a.requiresProject);
        return (
          <div key={a.id}>
            <button
              type="button"
              className={`station ${selected === a.id ? "selected" : ""} ${!owned ? "unbuilt" : ""}`}
              style={{ left: `${asset.x}%`, top: `${asset.y}%` }}
              data-select={a.id}
              onClick={() => select(a.id)}
              aria-label={`Seleziona ${a.name}`}
              aria-pressed={selected === a.id}
            >
              <img src={asset.src} alt="" draggable="false" />
              <span className="station-label">
                <strong>
                  {a.name
                    .replace(" delle gemme", "")
                    .replace(" delle lucciole", "")
                    .replace(" di nuvole", "")}
                </strong>
                <small>
                  {owned
                    ? `Liv. ${state.activities[a.id]} · ${number(rate(state, a.id))}/s`
                    : locked
                      ? "Da sbloccare"
                      : "Da costruire"}
                </small>
              </span>
            </button>
            {state.specialProducts[a.id].ready && (
              <button
                disabled={disabled}
                className="product"
                style={{ left: `${asset.x - 12}%`, top: `${asset.y + 6}%` }}
                data-gesture={`product:${a.id}`}
                onClick={() =>
                  game.dispatch({ type: "collectProduct", id: a.id })
                }
                aria-label={`Raccogli prodotto ${a.name}`}
              >
                <span className="product-shape" />
                <span>Raccogli</span>
              </button>
            )}
          </div>
        );
      })}
      {creatures.map((def) => {
        const c = state.creatures[def.id];
        if (!c.unlocked || !c.assignedActivityId) return null;
        const pos = placements[c.assignedActivityId],
          boosted = c.encouragedUntil > state.lastSimulatedAt;
        return (
          <button
            key={def.id}
            className={`scene-creature ${boosted ? "encouraged" : ""}`}
            style={{ left: `${pos.x + 14}%`, top: `${pos.y + 6}%` }}
            data-select={c.assignedActivityId}
            data-gesture={`creature:${def.id}`}
            onClick={() => select(c.assignedActivityId!)}
            aria-label={`Seleziona ${def.name}`}
          >
            <img
              src={creatureArt[def.id].src}
              alt={def.name}
              draggable="false"
            />
            {boosted && (
              <span className="boost-label">
                +50% ·{" "}
                {Math.ceil((c.encouragedUntil - state.lastSimulatedAt) / 1000)}s
              </span>
            )}
          </button>
        );
      })}
      <div
        className={`garden-label ${state.completedProjects.includes("ponte") ? "revealed" : ""}`}
      >
        <strong>Giardino delle lucciole</strong>
        <small>
          {state.completedProjects.includes("ponte")
            ? "Il giardino accoglie il borgo"
            : "Completa il Ponte per rivelarlo"}
        </small>
      </div>
      <p className="gesture-hint">Trascina sulle creature per incoraggiarle</p>
    </div>
  );
}
