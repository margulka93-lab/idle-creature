import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { activities, balance as b, creatures, projects } from "../content";
import {
  assigned,
  baseRate,
  rate,
  totalRate,
  upgradeCost,
  projectChecklist,
  encouragementDuration,
  nextCreatureMilestone,
  preferredTalentBonus,
  villageLevel,
  type State,
} from "../core/engine";
import { Scene, creatureArt } from "../scene/Scene";
import { downloadSave, game } from "./store";
import { ActivityList } from "./ActivityList";
import "./styles.css";
const fmt = (n: number, digits = 1) =>
  n.toLocaleString("it-IT", { maximumFractionDigits: digits });
const duration = (s: number) =>
  s >= 3600
    ? `${fmt(s / 3600)} ore`
    : s >= 60
      ? `${Math.floor(s / 60)} min ${Math.floor(s % 60)}s`
      : `${Math.ceil(s)}s`;
function Icon({ kind }: { kind: string }) {
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
function ProjectCard({
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
function CreatureCard({
  state,
  id,
  disabled,
}: {
  state: State;
  id: string;
  disabled: boolean;
}) {
  const def = creatures.find((c) => c.id === id)!,
    c = state.creatures[id];
  const boosted = c.encouragedUntil > state.lastSimulatedAt;
  return (
    <article className="creature-card">
      <div className="creature-heading">
        <img src={creatureArt[id].src} alt="" />
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
          <label className="assign-label" htmlFor={`assign-${id}`}>
            Dove lavora {def.name}
          </label>
          <select
            id={`assign-${id}`}
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
export function App() {
  const snap = useSyncExternalStore(game.subscribe, game.getSnapshot);
  const { state, warning, readOnly, corrupt, ready, summary, message } = snap;
  const [tab, setTab] = useState("Borgo"),
    [selected, setSelected] = useState<string | null>(null),
    [settings, setSettings] = useState(false);
  const [importText, setImportText] = useState("");
  const file = useRef<HTMLInputElement>(null);
  useEffect(game.start, []);
  const disabled = !ready || readOnly || !!corrupt;
  const activity = activities.find((a) => a.id === selected)!;
  const worker = selected ? assigned(state, selected) : undefined;
  const nextProject = projects.find(
    (p) => !state.completedProjects.includes(p.id),
  );
  const festivalActive = state.festivalEndsAt > state.lastSimulatedAt;
  const festivalWait = Math.max(
    0,
    (state.festivalReadyAt - state.lastSimulatedAt) / 1000,
  );
  const nextMilestone = b.milestones.find(
    (m) => !state.claimedMilestoneIds.includes(m.id),
  );
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("Borgo");
          }}
        >
          <span className="brand-mark">
            <Icon kind="Borgo" />
          </span>
          <span>
            Borgo delle
            <br />
            <strong>Creature</strong>
          </span>
        </a>
        <div className="resources">
          <div className="resource">
            <span className="coin" />
            <div>
              <small>Monete</small>
              <strong data-testid="coins">{fmt(state.coins)}</strong>
            </div>
          </div>
          <div className="resource">
            <span className="crystal" />
            <div>
              <small>Cristalli</small>
              <strong>{state.crystals}</strong>
            </div>
          </div>
          <div className="resource village">
            <Icon kind="Borgo" />
            <div>
              <small>Il tuo borgo</small>
              <strong>Livello {villageLevel(state)}</strong>
            </div>
          </div>
        </div>
        <button
          className="icon-button"
          onClick={() => setSettings(!settings)}
          aria-label="Impostazioni"
          aria-expanded={settings}
        >
          <Icon kind="Impostazioni" />
        </button>
      </header>
      {warning && (
        <div className="notice" role="alert">
          {warning}
        </div>
      )}
      {readOnly && ready && (
        <div className="notice" role="status">
          Questa scheda è in sola lettura. Il borgo continua nella scheda
          attiva.{" "}
          <button
            onClick={() => {
              void game.acquire();
            }}
          >
            Riprova dopo aver chiuso l’altra scheda
          </button>
        </div>
      )}
      {corrupt && (
        <div className="notice recovery">
          <p>
            La partita originale è conservata. Nessun nuovo dato la
            sovrascriverà.
          </p>
          <button onClick={() => downloadSave(corrupt, "borgo-recupero.json")}>
            Esporta dati originali
          </button>
          <button disabled={readOnly} onClick={game.reset}>
            Riparti da zero
          </button>
        </div>
      )}
      <nav className="navigation" aria-label="Sezioni del gioco">
        {["Borgo", "Creature", "Progetti", "Collezione"].map((name) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            aria-current={tab === name ? "page" : undefined}
            onClick={() => setTab(name)}
          >
            <Icon kind={name} />
            <span>{name}</span>
            {name === "Creature" && (
              <small>
                {
                  Object.values(state.creatures).filter((c) => c.unlocked)
                    .length
                }
                /3
              </small>
            )}
          </button>
        ))}
      </nav>
      <main>
        {summary && !readOnly && (
          <aside className="return-banner" aria-label="Riepilogo ritorno">
            <div>
              <strong>Bentornato · +{fmt(summary.earned)} monete</strong>
              <span>Già accreditate · puoi investire subito</span>
              <details>
                <summary>Dettagli dell’assenza</summary>
                <p>
                  {duration(summary.counted)} conteggiati · {summary.levels}{" "}
                  livelli · {summary.crystals} cristalli
                  {summary.capped ? " · limite 48h applicato" : ""}
                </p>
                {summary.talents.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </details>
            </div>
            <button
              className="secondary"
              onClick={() => game.emit({ summary: null })}
            >
              Nascondi riepilogo
            </button>
          </aside>
        )}
        <div className="page-intro">
          <div>
            <span className="eyebrow">IL TUO ANGOLO DI MERAVIGLIA</span>
            <h1>
              {tab === "Borgo"
                ? "Il tuo borgo"
                : tab === "Creature"
                  ? "Piccole mani, grandi magie."
                  : tab === "Progetti"
                    ? "Facciamo spazio ai sogni."
                    : "Ogni incontro, una storia."}
            </h1>
          </div>
          <span className="rate-pill">
            +{fmt(totalRate(state))} <small>monete / secondo</small>
          </span>
        </div>
        {state.completedProjects.includes("festa") && (
          <div className="completion" role="status">
            <strong>La prima festa del borgo è cominciata!</strong>
            <span>
              Tre amici, quattro attività e un luogo da chiamare casa. Hai
              completato il tuo primo borgo; i tuoi amici continuano a produrre.
              Prototipo completato.
            </span>
          </div>
        )}
        {tab === "Borgo" && (
          <div className="flow-layout">
            <section className="scene-column">
              <Scene
                state={state}
                selected={selected ?? ""}
                select={setSelected}
                disabled={disabled}
              />
              <div className="compact-festival">
                <div>
                  <strong>Ora delle meraviglie</strong>
                  <small>
                    {!state.completedProjects.includes(
                      b.festival.requiresProject,
                    )
                      ? "Completa il Sentiero · +50% a tutto il borgo"
                      : festivalActive
                        ? "Magia attiva: " +
                          duration(
                            (state.festivalEndsAt - state.lastSimulatedAt) /
                              1000,
                          )
                        : festivalWait > 0
                          ? "Ricarica: " + duration(festivalWait)
                          : "+50% per 20s · ricarica 5 min"}
                  </small>
                </div>
                <button
                  disabled={
                    disabled ||
                    !state.completedProjects.includes(
                      b.festival.requiresProject,
                    ) ||
                    festivalWait > 0
                  }
                  onClick={() => game.dispatch({ type: "activateFestival" })}
                >
                  {festivalActive ? "Meraviglie in corso" : "Attiva meraviglie"}
                </button>
              </div>
              {selected && activity && (
                <section
                  className="activity-details"
                  aria-label="Dettagli attività selezionata"
                >
                  <div className="settings-heading">
                    <h2>{activity.name}</h2>
                    <button
                      className="secondary"
                      onClick={() => setSelected(null)}
                    >
                      Chiudi dettagli
                    </button>
                  </div>
                  <p>
                    Livello {state.activities[selected]} ·{" "}
                    {fmt(baseRate(state, selected))} monete/s passive
                  </p>
                  {worker ? (
                    <CreatureCard
                      state={state}
                      id={worker[0]}
                      disabled={disabled}
                    />
                  ) : (
                    <p>
                      {state.activities[selected]
                        ? "Posto libero: assegna una creatura dalla sezione Creature."
                        : "Costruisci dalla lista del Borgo."}
                    </p>
                  )}
                </section>
              )}
            </section>
            <div className="operations">
              <ActivityList
                state={state}
                disabled={disabled}
                onDetails={setSelected}
                feedback={snap.upgradeFeedback}
              />
              {nextProject && (
                <section className="next-project">
                  <h2>Prossimo progetto</h2>
                  <ProjectCard
                    state={state}
                    id={nextProject.id}
                    disabled={disabled}
                  />
                </section>
              )}
            </div>
          </div>
        )}
        {tab === "Creature" && (
          <>
            <p className="section-description">
              Crescono lavorando, anche in tua assenza. Cambiare postazione è
              gratuito; ogni attività ospita un solo amico.
            </p>
            <div className="card-grid">
              {creatures.map((c) => (
                <CreatureCard
                  key={c.id}
                  state={state}
                  id={c.id}
                  disabled={disabled}
                />
              ))}
            </div>
          </>
        )}
        {tab === "Progetti" && (
          <>
            <p className="section-description">
              I cristalli arrivano dai traguardi di produzione totale. I
              progetti sono immediati e si realizzano in ordine.
            </p>
            <div className="milestone-banner">
              <strong>
                {fmt(state.lifetimeCoins)} monete prodotte in totale
              </strong>
              <span>
                {nextMilestone
                  ? `Prossimi ${nextMilestone.crystals} cristalli a ${fmt(nextMilestone.lifetimeCoins, 0)} monete prodotte`
                  : "Tutti i traguardi di cristalli sono stati raggiunti"}
              </span>
            </div>
            <div className="card-grid">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  state={state}
                  id={p.id}
                  disabled={disabled}
                />
              ))}
            </div>
          </>
        )}
        {tab === "Collezione" && (
          <>
            <p className="section-description">
              Le tre specie di questa prima avventura.{" "}
              {Object.values(state.creatures).filter((c) => c.unlocked).length}{" "}
              di 3 incontrate.
            </p>
            <div className="card-grid collection">
              {creatures.map((c) => (
                <article
                  key={c.id}
                  className={
                    !state.creatures[c.id].unlocked ? "undiscovered" : ""
                  }
                >
                  <img src={creatureArt[c.id].src} alt={c.name} />
                  <span className="eyebrow">
                    {state.creatures[c.id].unlocked
                      ? "INCONTRATO"
                      : "DA SCOPRIRE"}
                  </span>
                  <h2>{c.name}</h2>
                  <p>{c.appearance.split(";")[0]}</p>
                  <small>
                    {state.creatures[c.id].unlocked
                      ? `Livello ${state.creatures[c.id].level} · talento per ${activities.find((a) => a.id === c.preferredActivity)!.name}`
                      : `Si unirà al borgo acquistando ${activities.find((a) => a.id === c.preferredActivity)!.name}`}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
        {settings && (
          <section className="settings" aria-label="Salvataggio e impostazioni">
            <div className="settings-heading">
              <h2>La tua partita</h2>
              <button className="secondary" onClick={() => setSettings(false)}>
                Chiudi impostazioni
              </button>
            </div>
            <p>
              Salvataggio locale ogni 5 secondi e dopo le azioni.
              Un’esportazione permette di conservare la partita fuori da questo
              browser.
            </p>
            <p>
              Economia v2 · bonus automatici, acquisti multipli e talenti.
              Grafica SVG originale provvisoria: i raster illustrati definitivi
              restano da realizzare.
            </p>
            {snap.backup && (
              <button
                className="secondary"
                onClick={() =>
                  downloadSave(snap.backup!, "borgo-pre-F02-v1.json")
                }
              >
                Esporta backup pre-F02
              </button>
            )}
            <div className="settings-actions">
              <button
                onClick={() => {
                  game.tick();
                  downloadSave(
                    JSON.stringify(game.snapshot.state, null, 2),
                    `borgo-${Date.now()}.json`,
                  );
                }}
              >
                Esporta partita JSON
              </button>
              <button disabled={readOnly} onClick={() => file.current?.click()}>
                Importa file JSON
              </button>
              <button
                className="secondary"
                disabled={readOnly}
                onClick={game.reset}
              >
                Riparti da zero
              </button>
            </div>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 100_000)
                    game.emit({
                      message: "Importazione rifiutata: file troppo grande.",
                    });
                  else game.importSave(await f.text());
                }
                e.target.value = "";
              }}
            />
            <label htmlFor="import-json">
              Oppure incolla un salvataggio JSON
            </label>
            <textarea
              id="import-json"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              maxLength={100_001}
            />
            <button
              disabled={readOnly || !importText.trim()}
              onClick={() => game.importSave(importText)}
            >
              Valida e importa
            </button>
          </section>
        )}
        {import.meta.env.DEV &&
          new URLSearchParams(location.search).get("debug") === "1" && (
            <section className="debug" aria-label="Diagnostica sviluppo">
              <strong>Diagnostica · solo sviluppo</strong>
              <p>
                Avanzamenti tramite advance; i comandi usano il clock spostato.
                Esporta separatamente queste partite di prova.
              </p>
              {[60, 3600, 172800].map((s) => (
                <button
                  disabled={disabled}
                  key={s}
                  onClick={() => game.debugAdvance(s)}
                >
                  Salta {s === 60 ? "60s" : s === 3600 ? "1h" : "48h"}
                </button>
              ))}
              <button disabled={disabled} onClick={game.debugUnlock}>
                Sblocchi di test
              </button>
              <button disabled={disabled} onClick={game.reset}>
                Reset
              </button>
            </section>
          )}
      </main>
      <footer>
        Un borgo da coltivare, senza fretta.
        <span>Borgo delle Creature · F02</span>
      </footer>
      <div className="toast" role="status" aria-live="polite" key={message}>
        {message}
      </div>
    </div>
  );
}
