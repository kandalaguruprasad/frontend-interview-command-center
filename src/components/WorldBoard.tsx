import { Link } from 'react-router-dom';
import { QUEST_LEVELS } from '../data';
import { continueQuestTarget, levelMissionProgress, levelStatus } from '../quest/engine';
import { useStore } from '../state/store';
import type { LevelStatus, QuestLevel } from '../types';

const ZONE_TONE: Record<number, string> = {
  1: 'tone-html',
  2: 'tone-css',
  3: 'tone-js',
  4: 'tone-ts',
  5: 'tone-react',
  6: 'tone-next',
  7: 'tone-api',
  8: 'tone-arch',
  9: 'tone-proj',
  10: 'tone-final',
};

const SHORT: Record<LevelStatus, string> = {
  locked: 'Locked',
  available: 'Open',
  in_progress: 'Active',
  boss_available: 'Boss',
  completed: 'Done',
  mastered: 'Done',
};

function isFocus(status: LevelStatus) {
  return status === 'in_progress' || status === 'available' || status === 'boss_available';
}

export function WorldBoard() {
  const { state } = useStore();
  const focusId = QUEST_LEVELS.find((l) => isFocus(levelStatus(state, l)))?.id ?? 1;

  return (
    <div className="world-board" role="list">
      {QUEST_LEVELS.map((level) => {
        const status = levelStatus(state, level);
        return (
          <ZoneTile
            key={level.id}
            level={level}
            status={status}
            focus={level.id === focusId && isFocus(status)}
            tone={ZONE_TONE[level.id] || 'tone-html'}
          />
        );
      })}
    </div>
  );
}

function ZoneTile({
  level,
  status,
  focus,
  tone,
}: {
  level: QuestLevel;
  status: LevelStatus;
  focus: boolean;
  tone: string;
}) {
  const { state } = useStore();
  const locked = status === 'locked';
  const cleared = status === 'completed' || status === 'mastered';
  const prog = levelMissionProgress(state, level);
  const pct = prog.total
    ? Math.round((prog.done / prog.total) * 100)
    : cleared
      ? 100
      : 0;

  const className = [
    'zone-tile',
    tone,
    locked ? 'is-locked' : '',
    cleared ? 'is-cleared' : '',
    focus ? 'is-focus' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <div className="zone-tile-top">
        <span className="zone-tile-id">{cleared ? '✓' : level.id}</span>
        <span className={`badge badge-${status}`}>{SHORT[status]}</span>
      </div>
      <h3 className="zone-tile-title">{level.zone}</h3>
      <p className="zone-tile-role">{level.title}</p>
      {!locked && prog.total > 0 ? (
        <div className="zone-tile-prog">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span>
            {prog.done}/{prog.total}
          </span>
        </div>
      ) : null}
    </>
  );

  if (locked) {
    return (
      <div className={className} role="listitem" aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link to={`/level/${level.id}`} className={className} role="listitem">
      {body}
    </Link>
  );
}

export function ContinueDock() {
  const { state } = useStore();
  const target = continueQuestTarget(state);
  if (!target) return null;

  return (
    <div className="continue-dock" role="region" aria-label="Next step">
      <div className="continue-dock-inner">
        <div className="continue-dock-copy">
          <span className="continue-dock-label">Next step</span>
          <strong>{target.label}</strong>
        </div>
        <Link to={target.path} className="btn btn-primary">
          Continue
        </Link>
      </div>
    </div>
  );
}
