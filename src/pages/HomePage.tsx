import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QUEST_LEVELS, findTopic } from '../data';
import { WorldBoard } from '../components/WorldBoard';
import {
  continueQuestTarget,
  levelMissionProgress,
  levelStatus,
  playerRank,
} from '../quest/engine';
import { useStore } from '../state/store';
import type { LevelStatus, QuestLevel } from '../types';

type PathFilter = 'active' | 'open' | 'done' | 'all';

function statusBucket(status: LevelStatus): PathFilter | 'locked' {
  if (status === 'completed' || status === 'mastered') return 'done';
  if (status === 'locked') return 'locked';
  if (status === 'in_progress' || status === 'boss_available') return 'active';
  return 'open';
}

export function HomePage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<PathFilter>('active');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rank = playerRank(state.quest.xp || 0);
  const zonesCleared = QUEST_LEVELS.filter((l) => state.quest.bossPassed[l.id]).length;
  const target = continueQuestTarget(state);
  const journeyPct = Math.round((zonesCleared / 10) * 100);

  const focusDefault =
    QUEST_LEVELS.find((l) => {
      const s = levelStatus(state, l);
      return s === 'in_progress' || s === 'boss_available' || s === 'available';
    }) || QUEST_LEVELS[0];

  const selected =
    QUEST_LEVELS.find((l) => l.id === selectedId) || focusDefault;

  const selectedStatus = levelStatus(state, selected);
  const selectedProg = levelMissionProgress(state, selected);
  const nextMission = selectedProg.items.find((i) => !i.done);
  const nextTitle =
    nextMission?.type === 'topic'
      ? findTopic(nextMission.id)?.title
      : nextMission
        ? nextMission.id
        : selectedStatus === 'boss_available'
          ? 'Boss battle'
          : 'Open zone';

  const nextPath =
    nextMission?.type === 'topic'
      ? `/mission/${selected.id}/${nextMission.id}`
      : nextMission?.type === 'coding'
        ? `/coding/${nextMission.id}?level=${selected.id}`
        : nextMission?.type === 'lab'
          ? `/lab/${nextMission.id}?level=${selected.id}`
          : selectedStatus === 'boss_available'
            ? `/boss/${selected.id}`
            : `/level/${selected.id}`;

  const counts = useMemo(() => {
    let active = 0;
    let open = 0;
    let done = 0;
    for (const l of QUEST_LEVELS) {
      const b = statusBucket(levelStatus(state, l));
      if (b === 'active') active++;
      else if (b === 'open') open++;
      else if (b === 'done') done++;
    }
    return { active, open, done, all: QUEST_LEVELS.length };
  }, [state]);

  const visible = QUEST_LEVELS.filter((l) => {
    const b = statusBucket(levelStatus(state, l));
    if (filter === 'all') return true;
    if (filter === 'active') return b === 'active' || b === 'open';
    if (filter === 'open') return b === 'open' || b === 'active';
    if (filter === 'done') return b === 'done';
    return true;
  });

  const xpBars = [18, 28, 22, 40, 35, 48, 42, 55, 50, 62];

  return (
    <div className="saas-page">
      <header className="saas-page-head">
        <div>
          <h1 className="saas-title">Overview</h1>
          <p className="saas-desc">
            Manage your interview path in one place — one zone at a time.
          </p>
        </div>
        <div className="head-actions">
          <Link to="/map" className="btn btn-ghost">
            View map
          </Link>
          <Link to={target?.path || nextPath} className="btn btn-primary">
            + Continue quest
          </Link>
        </div>
      </header>

      <div className="metric-row">
        <article className="metric-card metric-card-photo">
          <div className="metric-card-body">
            <p className="metric-label">Experience</p>
            <p className="metric-value">{state.quest.xp || 0}</p>
            <p className="metric-trend up">{rank.title}</p>
          </div>
          <div className="metric-visual metric-visual-soft" aria-hidden="true" />
        </article>

        <article className="metric-card">
          <p className="metric-label">Zones cleared</p>
          <p className="metric-value">
            {zonesCleared}
            <span className="metric-suffix">/10</span>
          </p>
          <div className="mini-bars" aria-hidden="true">
            {QUEST_LEVELS.map((l) => (
              <span
                key={l.id}
                className={`mini-bar ${state.quest.bossPassed[l.id] ? 'on' : ''}`}
              />
            ))}
          </div>
        </article>

        <article className="metric-card">
          <p className="metric-label">Streak</p>
          <p className="metric-value">
            {state.meta.streak || 0}
            <span className="metric-suffix"> days</span>
          </p>
          <div className="mini-spark" aria-hidden="true">
            {xpBars.map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </article>

        <article className="metric-card">
          <p className="metric-label">Journey</p>
          <p className="metric-value">
            {journeyPct}
            <span className="metric-suffix">%</span>
          </p>
          <div className="pay-pills">
            <span className={journeyPct < 40 ? 'pay-pill on' : 'pay-pill'}>Warm-up</span>
            <span className={journeyPct >= 40 && journeyPct < 80 ? 'pay-pill on' : 'pay-pill'}>
              Mid
            </span>
            <span className={journeyPct >= 80 ? 'pay-pill on' : 'pay-pill'}>Final</span>
          </div>
        </article>
      </div>

      <div className="filter-row">
        <button
          type="button"
          className={`filter-chip ${filter === 'active' ? 'on' : ''}`}
          onClick={() => setFilter('active')}
        >
          In progress
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'open' ? 'on' : ''}`}
          onClick={() => setFilter('open')}
        >
          Available
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'done' ? 'on' : ''}`}
          onClick={() => setFilter('done')}
        >
          Cleared
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'all' ? 'on' : ''}`}
          onClick={() => setFilter('all')}
        >
          All zones
        </button>
        <div className="filter-search">
          <span aria-hidden="true">⌕</span>
          <span>{visible.length} showing</span>
        </div>
      </div>

      <section className="focus-panel">
        <div className="focus-list">
          <div className="focus-tabs">
            <button
              type="button"
              className={filter === 'all' ? 'focus-tab on' : 'focus-tab'}
              onClick={() => setFilter('all')}
            >
              All <em>{counts.all}</em>
            </button>
            <button
              type="button"
              className={filter === 'active' || filter === 'open' ? 'focus-tab on' : 'focus-tab'}
              onClick={() => setFilter('active')}
            >
              Active <em>{counts.active + counts.open}</em>
            </button>
            <button
              type="button"
              className={filter === 'done' ? 'focus-tab on' : 'focus-tab'}
              onClick={() => setFilter('done')}
            >
              Done <em>{counts.done}</em>
            </button>
          </div>

          <ul className="focus-items">
            {visible.map((level) => (
              <PathRow
                key={level.id}
                level={level}
                active={level.id === selected.id}
                onSelect={() => setSelectedId(level.id)}
              />
            ))}
          </ul>
        </div>

        <div className="focus-detail">
          <div className="focus-detail-top">
            <span className="focus-detail-id">L{String(selected.id).padStart(2, '0')}</span>
            <span className="focus-detail-badge">{statusLabel(selectedStatus)}</span>
          </div>
          <h3>{selected.zone}</h3>
          <div className="focus-detail-party">
            <span className="party-avatar">{selected.title.slice(0, 1)}</span>
            <div>
              <strong>{selected.title}</strong>
              <span>
                {selectedProg.done}/{selectedProg.total || 0} missions complete
              </span>
            </div>
          </div>

          <div className="detail-lines">
            {(selectedProg.items.length ? selectedProg.items : [{ id: 'x', type: 'topic' as const, done: false }])
              .slice(0, 4)
              .map((item) => (
                <div key={`${item.type}-${item.id}`} className={`detail-line ${item.done ? 'done' : ''}`}>
                  <span>{itemLabel(item)}</span>
                  <strong>{item.done ? 'Done' : 'Todo'}</strong>
                </div>
              ))}
            {!selectedProg.items.length ? (
              <div className="detail-line">
                <span>{selected.description.slice(0, 80)}…</span>
              </div>
            ) : null}
          </div>

          <div className="focus-detail-foot">
            <div>
              <span className="foot-label">Next</span>
              <strong className="foot-value">{nextTitle}</strong>
            </div>
            <Link
              to={
                selectedStatus === 'locked'
                  ? '#'
                  : target && selected.id === focusDefault.id
                    ? target.path
                    : nextPath
              }
              className={`btn btn-on-dark ${selectedStatus === 'locked' ? 'is-disabled' : ''}`}
              onClick={(e) => {
                if (selectedStatus === 'locked') e.preventDefault();
              }}
            >
              {selectedStatus === 'locked' ? 'Locked' : 'Start now'}
            </Link>
          </div>
        </div>
      </section>

      <section className="saas-block">
        <div className="saas-block-head">
          <div>
            <h2>World map</h2>
            <p>Zoomed-out board of every zone.</p>
          </div>
          <Link to="/map" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            Expand
          </Link>
        </div>
        <WorldBoard />
      </section>
    </div>
  );
}

function statusLabel(status: LevelStatus) {
  if (status === 'boss_available') return 'Boss ready';
  if (status === 'in_progress') return 'In progress';
  if (status === 'completed' || status === 'mastered') return 'Cleared';
  if (status === 'locked') return 'Locked';
  return 'Open';
}

function itemLabel(item: { type: string; id: string; done?: boolean }) {
  if (item.type === 'topic') return findTopic(item.id)?.title || item.id;
  return item.id;
}

function PathRow({
  level,
  active,
  onSelect,
}: {
  level: QuestLevel;
  active: boolean;
  onSelect: () => void;
}) {
  const { state } = useStore();
  const status = levelStatus(state, level);
  const locked = status === 'locked';
  const done = status === 'completed' || status === 'mastered';
  const prog = levelMissionProgress(state, level);

  return (
    <li className={`${active ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}>
      <button type="button" className="focus-item" onClick={onSelect} disabled={locked && !active}>
        <span className={`party-avatar sm ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
          {level.id}
        </span>
        <div className="focus-item-text">
          <strong>{level.zone}</strong>
          <span>
            {locked
              ? `Unlock after L${level.id - 1}`
              : prog.total
                ? `${prog.done}/${prog.total} missions`
                : level.title}
          </span>
        </div>
        <span className="focus-item-meta">{statusLabel(status)}</span>
        {!locked ? (
          <span className="focus-item-amt">{done ? '✓' : `${Math.round((prog.done / Math.max(prog.total, 1)) * 100)}%`}</span>
        ) : (
          <span className="focus-item-amt muted">—</span>
        )}
      </button>
    </li>
  );
}
