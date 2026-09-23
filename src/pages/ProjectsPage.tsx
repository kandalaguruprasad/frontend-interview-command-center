import { Link } from 'react-router-dom';
import { PROJECTS } from '../data';
import { awardXP, levelRequirementsMet, recordBossAttempt } from '../quest/engine';
import { findLevel } from '../data';
import { getItem, setItemStatus, useStore } from '../state/store';

export function ProjectsPage() {
  const { state, setState, pushXpPopup, triggerLevelUp } = useStore();
  const level = findLevel(9)!;
  const ready = levelRequirementsMet(state, level);
  const passed = !!state.quest.bossPassed[9];

  return (
    <>
      <p className="small faint">
        <Link to="/level/9">← Project Arena</Link>
      </p>
      <h1 className="page-title">Project Defence</h1>
      <p className="page-sub">Speak each answer. Mark confident only when you can defend it honestly.</p>

      {PROJECTS.map((project) => (
        <section key={project.id} className="card mt-16">
          <h2 style={{ margin: 0 }}>{project.name}</h2>
          <p className="small muted mt-8">{project.tagline}</p>
          <p className="prose mt-12">{project.context}</p>
          <ul className="mission-list">
            {project.questions.map((q) => {
              const status = getItem(state, 'project', q.id).status;
              const done = status === 'confident' || status === 'mastered';
              return (
                <li key={q.id} className={done ? 'done' : ''}>
                  <details style={{ flex: 1 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q.question}</summary>
                    <div className="prose-block prose mt-8">
                      <strong>30s:</strong> {q.thirtySec}
                    </div>
                    <div className="prose-block prose mt-8">
                      <strong>90s:</strong> {q.ninetySec}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary mt-12"
                      onClick={() => {
                        setState((s) => setItemStatus(s, 'project', q.id, 'confident'));
                        awardXP(
                          setState,
                          pushXpPopup,
                          20,
                          `Project Q: ${project.name}`,
                          `project:${q.id}:confident`,
                        );
                      }}
                    >
                      Mark confident
                    </button>
                  </details>
                  <span className="badge">{done ? 'Done' : status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {passed ? (
        <div className="good-banner mt-16">Project boss defeated.</div>
      ) : ready ? (
        <button
          type="button"
          className="btn btn-primary btn-lg mt-16"
          onClick={() => {
            recordBossAttempt(setState, 9, 100, true);
            awardXP(setState, pushXpPopup, 150, 'Boss battle passed: Project Defender', 'boss:9:pass');
            triggerLevelUp(9);
          }}
        >
          Claim Project Boss victory
        </button>
      ) : (
        <p className="small faint mt-16">Mark every question confident to unlock the boss claim.</p>
      )}
    </>
  );
}
