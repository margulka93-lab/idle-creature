import {
  useRef,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import manifest from "../content/art-manifest.json";
import { activities, creatures } from "../content";
import { type State } from "../core/engine";
import { game } from "../ui/store";
import { intersects, type Point } from "./geometry";
type Sprite = {
  src: string;
  fallbackSrc: string;
  width: number;
  height: number;
  pivot: number[];
  scale: number;
};
type Slot = Sprite & {
  mobileScale: number;
  anchor: number[];
  creatureAnchor: number[];
  mobileCreatureAnchor: number[];
  productAnchor: number[];
  mobileProductAnchor: number[];
};
const placements = manifest.activities as Record<string, Slot>;
export const creatureArt = manifest.creatures as Record<
  string,
  Sprite & { hitboxInset: number; minScreenWidth: number }
>;
export function Art({
  asset,
  alt = "",
  style,
}: {
  asset: { src: string; fallbackSrc: string };
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={asset.src}
      alt={alt}
      style={style}
      draggable="false"
      onError={(e) => {
        if (!e.currentTarget.dataset.fallback) {
          e.currentTarget.dataset.fallback = "true";
          e.currentTarget.src = asset.fallbackSrc;
        }
      }}
    />
  );
}
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
  const [size, setSize] = useState({ width: 800, height: 600 });
  useLayoutEffect(() => {
    const measure = () => {
      const r = root.current!.getBoundingClientRect();
      setSize((prev) =>
        prev.width === r.width && prev.height === r.height
          ? prev
          : { width: r.width, height: r.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  const mobile = size.width < 600;
  const scale = Math.max(
    size.width / manifest.background.width,
    size.height / manifest.background.height,
  );
  const imageWidth = manifest.background.width * scale,
    imageHeight = manifest.background.height * scale;
  const point = (anchor: number[]) => ({
    left: (size.width - imageWidth) / 2 + anchor[0] * imageWidth,
    top: (size.height - imageHeight) / 2 + anchor[1] * imageHeight,
  });
  const sprite = (
    asset: Sprite,
    anchor: number[],
    width: number,
    inset = 0,
  ): CSSProperties => {
    const p = point(anchor),
      height = (width * asset.height) / asset.width;
    return {
      left: p.left - width * asset.pivot[0] + inset,
      top: p.top - height * asset.pivot[1] + inset,
      width: width - inset * 2,
      height: height - inset * 2,
    };
  };
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
      <div className="scene-backdrop">
        <Art asset={manifest.background} />
      </div>
      {activities.map((a) => {
        const asset = placements[a.id],
          owned = state.activities[a.id] > 0;
        return (
          <div key={a.id}>
            <button
              type="button"
              className={`station ${selected === a.id ? "selected" : ""} ${owned ? "" : "unbuilt"}`}
              style={sprite(
                asset,
                asset.anchor,
                size.width * (mobile ? asset.mobileScale : asset.scale),
              )}
              data-select={a.id}
              onClick={() => select(a.id)}
              aria-label={`Seleziona ${a.name}`}
              aria-pressed={selected === a.id}
            >
              <Art asset={asset} />
              <span className="station-label">
                {a.name
                  .replace(" delle gemme", "")
                  .replace(" delle lucciole", "")
                  .replace(" di nuvole", "")}{" "}
                · {owned ? "L" + state.activities[a.id] : "Da costruire"}
              </span>
            </button>
            {state.specialProducts[a.id].ready && (
              <button
                disabled={disabled}
                className="product"
                style={{
                  ...point(
                    mobile ? asset.mobileProductAnchor : asset.productAnchor,
                  ),
                  left: Math.max(
                    36,
                    Math.min(
                      size.width - 36,
                      point(
                        mobile
                          ? asset.mobileProductAnchor
                          : asset.productAnchor,
                      ).left,
                    ),
                  ),
                }}
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
        const slot = placements[c.assignedActivityId],
          asset = creatureArt[def.id],
          width = Math.max(
            asset.minScreenWidth,
            Math.min(190, size.width * asset.scale),
          ),
          boosted = c.encouragedUntil > state.lastSimulatedAt;
        const position = sprite(
          asset,
          mobile ? slot.mobileCreatureAnchor : slot.creatureAnchor,
          width,
          asset.hitboxInset,
        );
        if (mobile) {
          // Keep the left collection gutter separate from creature hitboxes,
          // including when a return banner reduces the scene height.
          const leftGutter = slot.mobileCreatureAnchor[0] < 0.5 ? 78 : 8;
          position.left = Math.max(
            8,
            Math.min(
              size.width - width + asset.hitboxInset * 2 - 8,
              Math.max(leftGutter, Number(position.left)),
            ),
          );
        }
        return (
          <button
            key={def.id}
            className={`scene-creature ${boosted ? "encouraged" : ""}`}
            style={position}
            data-select={c.assignedActivityId}
            data-gesture={`creature:${def.id}`}
            onClick={() => select(c.assignedActivityId!)}
            aria-label={`Seleziona ${def.name}`}
          >
            <Art
              asset={asset}
              alt={def.name}
              style={{
                left: -asset.hitboxInset,
                top: -asset.hitboxInset,
                width,
                height: (width * asset.height) / asset.width,
              }}
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
      {state.completedProjects.includes("ponte") && (
        <div className="garden-label" style={point([0.5, 0.87])}>
          Giardino delle lucciole
        </div>
      )}
      <p className="gesture-hint">Trascina sulle creature per incoraggiarle</p>
    </div>
  );
}
