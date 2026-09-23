import { Link, Navigate, useParams } from 'react-router-dom';
import { ContinueDock } from '../components/WorldBoard';
import { findLevel } from '../data';
import {
  bossAttemptedToday,
  isLevelUnlocked,
  levelMissionProgress,
  levelRequirementsMet,
  levelStatus,
  missionItemTitle,
} from '../quest/engine';
import { useStore } from '../state/store';

const STATUS_LABEL: Record<string, string> = {
  locked: 'Locked',
  available: 'Open',
  in_progress: 'In progress',
  boss_available: 'Boss ready',
  completed: 'Cleared',
  mastered: 'Mastered',
};

export function LevelPage() {
  const { id } = useParams();
  const levelId = Number(id);
  const level = findLevel(levelId);
  const { state } = useStore();

  if (!level) return <Navigate to="/map" replace />;
  if (!isLevelUnlocked(state, level.id)) return <Navigate to="/map" replace />;

  const status = levelStatus(state, level);
  const prog = levelMissionProgress(state, level);
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
  const bossReady = levelRequirementsMet(state, level);
  const attemptedToday = bossAttemptedToday(state, level.id);
  const passed = !!state.quest.bossPassed[level.id];
  const nextOpen = prog.items.find((i) => !i.done);
  const nextPath = nextOpen
    ? nextOpen.type === 'topic'
      ? `/mission/${level.id}/${nextOpen.id}`
      : nextOpen.type === 'coding'
        ? `/coding/${nextOpen.id}?level=${level.id}`
        : `/lab/${nextOpen.id}?level=${level.id}`
    : bossReady && !passed
      ? `/boss/${level.id}`
      : null;

  return (
    <div className="saas-page">
      <Link to="/" className="back-link">
        ← Overview
      </Link>

      <header className="saas-page-head mt-12">
        <div>
          <p className="saas-kicker">
            Level {level.id} · {STATUS_LABEL[status]}
          </p>
          <h1 className="saas-title">{level.zone}</h1>
          <p className="saas-desc">{level.title}</p>
        </div>
        {nextPath ? (
          <Link to={nextPath} className="btn btn-primary">
            Next mission
          </Link>
        ) : null}
      </header>

      {prog.total > 0 ? (
        <div className="level-progress-card">
          <div className="flex justify-between items-center">
            <span className="small muted">
              {prog.done} of {prog.total} missions
            </span>
            <span className="small" style={{ fontWeight: 700 }}>
              {pct}%
            </span>
          </div>
          <div className="progress-track" style={{ marginTop: 10, height: 8 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}

      {prog.total > 0 ? (
        <ul className="mission-list mt-16">
          {prog.items.map((item) => {
            const path =
              item.type === 'topic'
                ? `/mission/${level.id}/${item.id}`
                : item.type === 'coding'
                  ? `/coding/${item.id}?level=${level.id}`
                  : `/lab/${item.id}?level=${level.id}`;
            const isNext = !!(nextOpen && nextOpen.id === item.id && nextOpen.type === item.type);
            return (
              <li key={`${item.type}:${item.id}`} className={`${item.done ? 'done' : ''} ${isNext ? 'mission-next' : ''}`}>
                <Link to={path}>
                  {isNext ? <span className="mission-next-tag">Next</span> : null}
                  {missionItemTitle(item)}
                </Link>
                <span className={`badge ${item.done ? 'badge-completed' : ''}`}>
                  {item.done ? 'Done' : item.type}
                </span>
              </li>
            );
          })}
        </ul>
      ) : level.id === 9 ? (
        <div className="card mt-16">
          <p className="muted">Mark every project defence question confident to unlock the boss.</p>
          <Link to="/projects" className="btn btn-primary mt-12">
            Open projects
          </Link>
        </div>
      ) : (
        <div className="card mt-16">
          <p className="muted">Final interview gauntlet — timed mocks.</p>
          <Link to="/mock" className="btn btn-primary mt-12">
            Open mock arena
          </Link>
        </div>
      )}

      <section className={`boss-card ${passed ? 'cleared' : ''}`}>
        <div className="flex justify-between items-center flex-wrap gap-8">
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>Boss battle</h3>
          <span className="badge">{level.boss.type}</span>
        </div>
        <p className="muted mt-8" style={{ fontSize: '0.95rem' }}>
          {level.boss.description}
        </p>
        {passed ? (
          <div className="good-banner">Zone cleared.</div>
        ) : !bossReady ? (
          <p className="small faint mt-12">Finish the missions above to unlock this.</p>
        ) : attemptedToday && !passed ? (
          <div className="warn-banner">Already attempted today. Try again tomorrow.</div>
        ) : (
          <Link to={`/boss/${level.id}`} className="btn btn-primary mt-12">
            Start boss
          </Link>
        )}
      </section>

      <ContinueDock />
    </div>
  );
}
