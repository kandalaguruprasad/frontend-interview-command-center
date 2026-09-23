import { Link } from 'react-router-dom';
import type { LevelStatus, QuestLevel } from '../types';
import { levelMissionProgress } from '../quest/engine';
import { useStore } from '../state/store';

const STATUS_LABEL: Record<LevelStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In progress',
  boss_available: 'Boss ready',
  completed: 'Cleared',
  mastered: 'Mastered',
};

function numClass(status: LevelStatus) {
  if (status === 'locked') return 'zone-num locked';
  if (status === 'completed' || status === 'mastered') return 'zone-num cleared';
  if (status === 'boss_available') return 'zone-num boss';
  return 'zone-num';
}

export function ZoneCard({
  level,
  status,
  showProgress = true,
  delayIndex = 0,
}: {
  level: QuestLevel;
  status: LevelStatus;
  showProgress?: boolean;
  delayIndex?: number;
}) {
  const { state } = useStore();
  const locked = status === 'locked';
  const prog = levelMissionProgress(state, level);
  const pct = prog.total
    ? Math.round((prog.done / prog.total) * 100)
    : state.quest.bossPassed[level.id]
      ? 100
      : 0;

  const inner = (
    <div className="zone-card">
      <div className={numClass(status)} aria-hidden="true">
        {status === 'completed' || status === 'mastered' ? '✓' : level.id}
      </div>
      <div className="zone-body">
        <div className="zone-meta">
          Level {level.id} · {level.zone}
        </div>
        <h3>{level.title}</h3>
        <p className="small muted" style={{ margin: '6px 0 0' }}>
          {level.description}
        </p>
        {!locked && showProgress && prog.total > 0 ? (
          <>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="small faint mt-8">
              {prog.done}/{prog.total} missions
            </p>
          </>
        ) : null}
        {locked ? (
          <p className="small faint mt-8">Pass Level {level.id - 1}&apos;s boss to unlock.</p>
        ) : null}
      </div>
      <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
    </div>
  );

  const wrapClass = `zone-enter ${locked ? 'card locked' : 'card clickable'}`;
  const style = { animationDelay: `${0.04 + delayIndex * 0.05}s` } as const;

  if (locked) {
    return (
      <div className={wrapClass} style={style}>
        {inner}
      </div>
    );
  }

  return (
    <Link to={`/level/${level.id}`} className={wrapClass} style={{ ...style, display: 'block' }}>
      {inner}
    </Link>
  );
}
