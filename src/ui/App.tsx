import { useEffect, useState, useSyncExternalStore } from "react";
import { activities, balance as b, creatures, projects } from "../content";
import {
  assigned,
  rate,
  totalRate,
  villageLevel,
  projectChecklist,
  encouragementDuration,
} from "../core/engine";
import { Art, Scene, creatureArt } from "../scene/Scene";
import { ActivityList, PreviewContent, UpgradeAction } from "./Activities";
import { Icon, CreatureCard, ProjectCard } from "./Details";
import { Dialog } from "./Dialog";
import { Settings } from "./Settings";
import { ModeSelector, usePurchaseMode } from "./purchaseMode";
import { compact, duration, fmt } from "./format";
import { downloadSave, game } from "./store";
import "./styles.css";
function useMobile() {
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width:760px)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(max-width:760px)"),
      change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return mobile;
}
export function App() {
  const snap = useSyncExternalStore(game.subscribe, game.getSnapshot);
  const { state, warning, readOnly, corrupt, ready, summary, message } = snap;
  const [tab, setTab] = useState("Borgo"),
    [selected, setSelected] = useState("orto"),
    [manage, setManage] = useState(false),
    [settings, setSettings] = useState(false),
    [details, setDetails] = useState(false),
    [preview, setPreview] = useState<string | null>(null),
    [project, setProject] = useState<string | null>(null),
    [returnDetails, setReturnDetails] = useState(false);
  const [mode, changeMode] = usePurchaseMode();
  const mobile = useMobile();
  useEffect(game.start, []);
  const disabled = !ready || readOnly || !!corrupt;
  const activity = activities.find((a) => a.id === selected)!,
    worker = assigned(state, selected),
    nextProject = projects.find((p) => !state.completedProjects.includes(p.id));
  const festivalActive = state.festivalEndsAt > state.lastSimulatedAt,
    festivalWait = Math.max(
      0,
      (state.festivalReadyAt - state.lastSimulatedAt) / 1000,
    );
  const boosted = worker && worker[1].encouragedUntil > state.lastSimulatedAt;
  const nextMilestone = b.milestones.find(
    (m) => !state.claimedMilestoneIds.includes(m.id),
  );
  const actions = (
    <div className="selected-commands">
      {worker ? (
        <button
          className="pet-command secondary"
          disabled={disabled}
          onClick={() => game.dispatch({ type: "encourage", id: worker[0] })}
          aria-label={`Incoraggia ${creatures.find((c) => c.id === worker[0])!.name}`}
        >
          <span aria-hidden="true">♡</span>
          <span>
            {mobile
              ? "Incoraggia"
              : `Incoraggia ${creatures.find((c) => c.id === worker[0])!.name}`}
            <small>
              {boosted
                ? `+50% · ${duration((worker[1].encouragedUntil - state.lastSimulatedAt) / 1000)}`
                : mobile
                  ? `+50% · ${duration(encouragementDuration(worker[1].level))}`
                  : "+50% produzione"}
            </small>
          </span>
        </button>
      ) : (
        <span className="empty-worker">
          {state.activities[selected] ? "Posto libero" : "Una nuova attività"}
        </span>
      )}
      {state.specialProducts[selected].ready && (
        <button
          className="product-command secondary"
          disabled={disabled}
          onClick={() =>
            game.dispatch({ type: "collectProduct", id: selected })
          }
          aria-label={`Raccogli prodotto dalla lista ${activity.name}`}
        >
          Raccogli prodotto
        </button>
      )}
      <button
        className="details-command secondary"
        onClick={() => setDetails(true)}
        aria-label={`Dettagli ${activity.name}`}
      >
        <Icon kind="Creature" />
        <span>Dettagli</span>
      </button>
    </div>
  );
  const nextProjectRow = nextProject ? (
    <button
      className="next-project-row"
      onClick={() => setProject(nextProject.id)}
      aria-label={`Prossimo progetto: ${nextProject.name}`}
    >
      <span className="project-emblem">
        <Icon kind="Progetti" />
      </span>
      <span>
        <small>Prossimo progetto</small>
        <strong>{nextProject.name}</strong>
        <small>
          {projectChecklist(state, nextProject.id).filter((c) => c.met).length}/
          {projectChecklist(state, nextProject.id).length} condizioni ·{" "}
          {fmt(nextProject.coinsCost, 0)} monete · {nextProject.crystalsCost}{" "}
          cristalli
        </small>
      </span>
      <span aria-hidden="true">›</span>
    </button>
  ) : (
    <div className="complete-strip" role="status">
      <strong>La prima festa del borgo è cominciata!</strong>
      <span>Prototipo completato · il borgo continua a crescere</span>
    </div>
  );
  const operations = (
    <>
      <div className="operations-heading">
        <h2>Fai crescere il borgo</h2>
        <span>Acquista per obiettivi</span>
      </div>
      <ModeSelector mode={mode} change={changeMode} />
      <ActivityList
        state={state}
        mode={mode}
        disabled={disabled}
        select={setSelected}
        selected={selected}
        preview={setPreview}
        feedback={snap.upgradeFeedback}
      />
      {nextProjectRow}
    </>
  );
  return (
    <div className={`app-shell ${tab === "Borgo" ? "village-view" : ""}`}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          aria-label="Borgo delle Creature"
          onClick={(e) => {
            e.preventDefault();
            setTab("Borgo");
          }}
        >
          <span className="brand-mark">
            <Icon kind="Borgo" />
          </span>
          <span>
            Borgo delle <strong>Creature</strong>
          </span>
        </a>
        <div className="resources">
          <div className="resource">
            <span className="coin" aria-hidden="true" />
            <div>
              <small>Monete</small>
              <strong data-testid="coins" title={fmt(state.coins, 3)}>
                {compact(state.coins)}
              </strong>
            </div>
          </div>
          <div className="resource">
            <span className="crystal" aria-hidden="true" />
            <div>
              <small>Cristalli</small>
              <strong>{state.crystals}</strong>
            </div>
          </div>
          <div className="resource village">
            <Icon kind="Borgo" />
            <div>
              <small>Borgo</small>
              <strong>L{villageLevel(state)}</strong>
            </div>
          </div>
        </div>
        <div
          className="total-income"
          title={`${fmt(totalRate(state), 6)} monete al secondo`}
        >
          <span className="live-dot" />+{compact(totalRate(state))}
          <small>monete/s</small>
        </div>
        <button
          className="icon-button secondary"
          aria-label="Impostazioni"
          onClick={() => setSettings(true)}
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
            La partita originale è conservata. Esportala o riparti
            esplicitamente.
          </p>
          <button onClick={() => downloadSave(corrupt, "borgo-recupero.json")}>
            Esporta dati originali
          </button>
          <button disabled={readOnly} onClick={game.reset}>
            Riparti da zero
          </button>
        </div>
      )}
      {summary && !readOnly && (
        <aside className="return-banner" aria-label="Riepilogo ritorno">
          <button onClick={() => setReturnDetails(true)}>
            <span>Bentornato</span>
            <strong>+{compact(summary.earned)} monete</strong>
            <span>Dettagli dell’assenza ›</span>
          </button>
          <button
            className="icon-button secondary"
            aria-label="Nascondi riepilogo"
            onClick={() => game.emit({ summary: null })}
          >
            ×
          </button>
        </aside>
      )}
      <main className="main-content">
        <section
          className="village-layout"
          hidden={tab !== "Borgo"}
          aria-label="Borgo principale"
        >
          <div className="scene-column">
            <Scene
              state={state}
              selected={selected}
              select={setSelected}
              disabled={disabled}
            />
            <div className="scene-tools">
              <div className="selected-summary">
                <span>
                  {activity.name} · L{state.activities[selected]}
                </span>
                <strong>{compact(rate(state, selected))} monete/s</strong>
              </div>
              <div className="desktop-selected-actions">
                {!mobile && actions}
              </div>
              <button
                className="festival-command secondary"
                disabled={
                  disabled ||
                  !state.completedProjects.includes(
                    b.festival.requiresProject,
                  ) ||
                  festivalWait > 0
                }
                onClick={() => game.dispatch({ type: "activateFestival" })}
                aria-label={
                  festivalActive ? "Meraviglie in corso" : "Attiva meraviglie"
                }
              >
                <span aria-hidden="true">✧</span>
                <span>
                  Meraviglie
                  <small>
                    {!state.completedProjects.includes(
                      b.festival.requiresProject,
                    )
                      ? "Richiede Sentiero"
                      : festivalActive
                        ? duration(
                            (state.festivalEndsAt - state.lastSimulatedAt) /
                              1000,
                          )
                        : festivalWait > 0
                          ? duration(festivalWait)
                          : "+50% · 20s"}
                  </small>
                </span>
              </button>
            </div>
          </div>
          {!mobile && (
            <aside className="operations" aria-label="Gestione del borgo">
              {operations}
            </aside>
          )}
          {mobile && (
            <section
              className="mobile-dock"
              aria-label="Comandi rapidi"
              data-testid="selected-actions"
            >
              <div className="dock-title">
                <h2>
                  {activity.name} <span>L{state.activities[selected]}</span>
                </h2>
                <button
                  className="management-open secondary"
                  onClick={() => setManage(true)}
                  aria-label="Gestisci quattro attività"
                >
                  Gestisci <span aria-hidden="true">↑</span>
                </button>
                <button
                  className="dock-project"
                  onClick={() =>
                    nextProject
                      ? setProject(nextProject.id)
                      : setTab("Progetti")
                  }
                  aria-label={
                    nextProject
                      ? `Prossimo progetto: ${nextProject.name}`
                      : "Progetti completati"
                  }
                >
                  <Icon kind="Progetti" />
                </button>
              </div>
              <ModeSelector mode={mode} change={changeMode} />
              <UpgradeAction
                state={state}
                id={selected}
                mode={mode}
                disabled={disabled}
                preview={setPreview}
              />
              <p className="dock-feedback" role="status">
                {snap.upgradeFeedback[selected] ?? ""}
              </p>
              {actions}
            </section>
          )}
        </section>
        <section
          className="secondary-page"
          hidden={tab !== "Creature"}
          aria-label="Creature del borgo"
        >
          <div className="section-heading">
            <h1>Creature</h1>
            <p>Crescono lavorando, anche mentre sei lontano.</p>
          </div>
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
        </section>
        <section
          className="secondary-page"
          hidden={tab !== "Progetti"}
          aria-label="Progetti del borgo"
        >
          <div className="section-heading">
            <h1>Progetti</h1>
            <p>
              {fmt(state.lifetimeCoins, 0)} monete prodotte ·{" "}
              {nextMilestone
                ? `Prossimi ${nextMilestone.crystals} cristalli a ${fmt(nextMilestone.lifetimeCoins, 0)}`
                : "Tutti i traguardi cristalli raggiunti"}
            </p>
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
        </section>
        <section
          className="secondary-page"
          hidden={tab !== "Collezione"}
          aria-label="Collezione delle specie"
        >
          <div className="section-heading">
            <h1>Collezione</h1>
            <p>
              {Object.values(state.creatures).filter((c) => c.unlocked).length}{" "}
              specie incontrate su 3
            </p>
          </div>
          <div className="card-grid collection">
            {creatures.map((c) => (
              <article
                key={c.id}
                className={
                  !state.creatures[c.id].unlocked ? "undiscovered" : ""
                }
              >
                <Art asset={creatureArt[c.id]} alt={c.name} />
                <h2>{c.name}</h2>
                <p>
                  {state.creatures[c.id].unlocked
                    ? `Livello ${state.creatures[c.id].level}`
                    : `Acquista ${activities.find((a) => a.id === c.preferredActivity)!.name}`}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <nav className="navigation" aria-label="Sezioni del gioco">
        {["Borgo", "Creature", "Progetti", "Collezione"].map((name) => (
          <button
            key={name}
            aria-current={tab === name ? "page" : undefined}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            <Icon kind={name} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      <Dialog
        open={manage && mobile}
        close={() => setManage(false)}
        title="Gestione del borgo"
        variant="management-drawer"
      >
        {operations}
      </Dialog>
      <Dialog
        open={!!preview}
        close={() => setPreview(null)}
        title={`Anteprima ${activities.find((a) => a.id === preview)?.name ?? ""}`}
        variant="preview-dialog"
      >
        {preview && (
          <PreviewContent
            state={state}
            id={preview}
            mode={mode}
            feedback={snap.upgradeFeedback[preview]}
          />
        )}
      </Dialog>
      <Dialog
        open={details}
        close={() => setDetails(false)}
        title={`Dettagli ${activity.name}`}
        variant="details-dialog"
      >
        <section aria-label="Dettagli attività selezionata">
          <p>
            L{state.activities[selected]} · {fmt(rate(state, selected), 3)}{" "}
            monete/s
          </p>
          {worker ? (
            <CreatureCard state={state} id={worker[0]} disabled={disabled} />
          ) : (
            <p>
              Assegna una creatura dalla sezione Creature. Le attività possedute
              producono anche da sole.
            </p>
          )}
          <button
            className="secondary"
            onClick={() => {
              setPreview(selected);
            }}
          >
            Vedi anteprima acquisto
          </button>
        </section>
      </Dialog>
      <Dialog
        open={!!project}
        close={() => setProject(null)}
        title="Prossimo progetto"
        variant="project-dialog"
      >
        {project && (
          <ProjectCard state={state} id={project} disabled={disabled} />
        )}
      </Dialog>
      <Dialog
        open={settings}
        close={() => setSettings(false)}
        title="Impostazioni"
      >
        <Settings readOnly={readOnly} onClose={() => setSettings(false)} />
      </Dialog>
      <Dialog
        open={returnDetails && !!summary}
        close={() => setReturnDetails(false)}
        title="Dettagli dell’assenza"
      >
        {summary && (
          <div className="return-details">
            <h3>+{fmt(summary.earned)} monete già accreditate</h3>
            <p>
              {duration(summary.counted)} conteggiati · {summary.levels} livelli
              · {summary.crystals} cristalli
              {summary.capped ? " · limite 48h applicato" : ""}
            </p>
            {summary.talents.map((t) => (
              <p key={t}>{t}</p>
            ))}
            <p>
              Puoi investire dal borgo: consultare o chiudere questo riepilogo
              non accredita altre risorse.
            </p>
          </div>
        )}
      </Dialog>
      {import.meta.env.DEV &&
        new URLSearchParams(location.search).get("debug") === "1" && (
          <section className="debug" aria-label="Diagnostica sviluppo">
            <strong>Diagnostica sviluppo</strong>
            {[60, 3600, 172800].map((s) => (
              <button
                key={s}
                disabled={disabled}
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
      <div
        className="toast"
        role="status"
        aria-live="polite"
        key={message}
        hidden={settings}
      >
        {message}
      </div>
    </div>
  );
}
