import { useId } from "react";
import { activities, balance as b, creatures, projects } from "../content";
import {
  assigned,
  rate,
  projectChecklist,
  encouragementDuration,
  nextCreatureMilestone,
  preferredTalentBonus,
  type State,
} from "../core/engine";
import { Art, creatureArt } from "../scene/Scene";
import { game } from "./store";

const fmt = (n: number, digits = 1) =>
  n.toLocaleString("it-IT", { maximumFractionDigits: digits });
const duration = (s: number) =>
  s >= 3600
    ? `${fmt(s / 3600)} ore`
    : s >= 60
      ? `${Math.floor(s / 60)} min ${Math.floor(s % 60)}s`
      : `${Math.ceil(s)}s`;
export function Icon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    Borgo: "M3 11 12 3l9 8M5 10v11h14V10M10 21v-7h4v7",
    Creature:
      "M5 9 3 3l7 4h4l7-4-2 6q5 12-7 12T5 9M8 13h.1M16 13h.1M10 17q2 2 4 0",
    Progetti: "M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5",
    Collezione: "M12 5Q7 2 2 4v16q5-2 10 1 5-3 10-1V4q-5-2-10 1Zm0 0v16",
    Impostazioni: "M4 7h16M4 17h16M8 4v6M16 14v6",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind] ?? paths.Borgo} />
    </svg>
  );
}
export function ProjectCard({
  state,
  id,
  disabled,
}: {
  state: State;
  id: string;
  disabled: boolean;
}) {
  const p = projects.find((p) => p.id === id)!;
  const completed = state.completedProjects.includes(id);
  const checklist = projectChecklist(state, id);
  const prereq = checklist.every((check) => check.met);
  const enough = state.coins >= p.coinsCost && state.crystals >= p.crystalsCost;
  const result: Record<string, string> = {
    sentiero: "Mulino di nuvole e Ora delle meraviglie",
    ponte: "Laboratorio e giardino delle lucciole",
    festa: "La prima festa: il traguardo di questa avventura",
  };
  return (
    <article className={`project-card ${completed ? "done" : ""}`}>
      <span className="eyebrow">
        {completed ? "REALIZZATO" : `BORGO LIVELLO ${p.villageLevel}`}
      </span>
      <h3>{p.name}</h3>
      <p>{result[id]}</p>
      {!completed && (
        <>
          <ul className="project-checklist" aria-label={`Requisiti ${p.name}`}>
            {checklist.map((check) => (
              <li key={check.label} className={check.met ? "met" : ""}>
                <span aria-label={check.met ? "Raggiunto" : "Mancante"}>
                  {check.met ? "✓" : "○"}
                </span>{" "}
                {check.label}
              </li>
            ))}
          </ul>
          <div className="cost-line">
            <span className="coin" />
            {fmt(p.coinsCost, 0)} <span className="crystal" />
            {p.crystalsCost}
          </div>
          <progress
            max={p.coinsCost}
            value={Math.min(state.coins, p.coinsCost)}
            aria-label={`Monete per ${p.name}`}
          />
          <small>
            {fmt(state.coins, 0)}/{fmt(p.coinsCost, 0)} monete ·{" "}
            {state.crystals}/{p.crystalsCost} cristalli
          </small>
          <button
            disabled={disabled || !prereq || !enough}
            onClick={() => game.dispatch({ type: "completeProject", id })}
          >
            Realizza progetto
          </button>
        </>
      )}
      {completed && <strong className="success">Il borgo è cresciuto</strong>}
    </article>
  );
}
export function CreatureCard({
  state,
  id,
  disabled,
}: {
  state: State;
  id: string;
  disabled: boolean;
}) {
  const selectId = useId();
  const def = creatures.find((c) => c.id === id)!,
    c = state.creatures[id];
  const boosted = c.encouragedUntil > state.lastSimulatedAt;
  return (
    <article className="creature-card">
      <div className="creature-heading">
        <Art asset={creatureArt[id]} />
        <div>
          <span className="eyebrow">
            {c.unlocked ? "UN ABITANTE DEL BORGO" : "DA INCONTRARE"}
          </span>
          <h2>{def.name}</h2>
          <p>
            {c.unlocked
              ? `Livello ${c.level}`
              : `Acquista ${activities.find((a) => def.unlock === `own:${a.id}`)?.name}`}
          </p>
        </div>
      </div>
      {c.unlocked && (
        <>
          <div className="progress-label">
            <strong>Crescita</strong>
            <span>
              {c.level === b.creatureMaxLevel
                ? "Livello massimo"
                : `${fmt(c.xpInLevel, 0)} / ${b.creature.xpToNextLevelBase * c.level} XP`}
            </span>
          </div>
          <progress
            value={c.level === b.creatureMaxLevel ? 1 : c.xpInLevel}
            max={
              c.level === b.creatureMaxLevel
                ? 1
                : b.creature.xpToNextLevelBase * c.level
            }
            aria-label={`Crescita di ${def.name}`}
          />
          <div className="talent">
            <strong>Il suo posto del cuore</strong>
            <p>
              {activities.find((a) => a.id === def.preferredActivity)!.name} ·
              talento +
              {fmt(
                (b.creature.preferredBonus + preferredTalentBonus(c.level)) *
                  100,
                0,
              )}
              %
            </p>
            <small>
              Assegnazione +
              {fmt(
                (b.creature.assignedBonus +
                  (c.level - 1) * b.creature.bonusPerLevel) *
                  100,
                0,
              )}
              % · cresce di 1 XP/s mentre lavora
            </small>
          </div>
          <p className="next-talent">
            {nextCreatureMilestone(c.level)
              ? `Prossimo talento L${nextCreatureMilestone(c.level)!.level}: ${nextCreatureMilestone(c.level)!.preferredAssignmentBonusAdd ? "+10% nell’attività preferita" : `carezze ${nextCreatureMilestone(c.level)!.encouragementDurationSeconds}s`}`
              : "Tutti i talenti raggiunti"}{" "}
            · carezze attuali {encouragementDuration(c.level)}s
          </p>
          <label className="assign-label" htmlFor={selectId}>
            Dove lavora {def.name}
          </label>
          <select
            id={selectId}
            value={c.assignedActivityId ?? ""}
            disabled={disabled}
            onChange={(e) =>
              game.dispatch({
                type: "assignCreature",
                id,
                activityId: e.target.value || null,
              })
            }
          >
            <option value="">A riposo · nessuna produzione extra</option>
            {activities
              .filter((a) => state.activities[a.id] > 0)
              .map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                  disabled={
                    !!assigned(state, a.id) && assigned(state, a.id)![0] !== id
                  }
                >
                  {a.name}
                  {assigned(state, a.id) && assigned(state, a.id)![0] !== id
                    ? " · occupato"
                    : ""}
                </option>
              ))}
          </select>
          <button
            className="encourage"
            disabled={disabled || !c.assignedActivityId}
            onClick={() => game.dispatch({ type: "encourage", id })}
          >
            Incoraggia {def.name}
            <span>
              {boosted
                ? `+50% · ${duration((c.encouragedUntil - state.lastSimulatedAt) / 1000)} rimasti`
                : `+50% produzione per ${encouragementDuration(c.level)} secondi`}
            </span>
          </button>
        </>
      )}
    </article>
  );
}
