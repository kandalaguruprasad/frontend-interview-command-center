import { Link } from 'react-router-dom';
import { findLevel } from '../data';
import { useStore } from '../state/store';

export function LevelUpOverlay() {
  const { levelUpLevelId, clearLevelUp } = useStore();
  if (levelUpLevelId == null) return null;
  const level = findLevel(levelUpLevelId);
  if (!level) return null;
  const next = findLevel(level.id + 1);

  return (
    <div className="levelup-overlay" role="status" onClick={clearLevelUp}>
      <div className="levelup-card" onClick={(e) => e.stopPropagation()}>
        <p className="section-label" style={{ marginBottom: 8 }}>
          Zone cleared
        </p>
        <div className="levelup-title">Level Up!</div>
        <div className="levelup-zone">{level.zone}</div>
        <p className="muted mt-8">{level.title} — boss defeated</p>
        <div className="flex gap-12 flex-wrap mt-24" style={{ justifyContent: 'center' }}>
          {next ? (
            <Link to={`/level/${next.id}`} className="btn btn-primary btn-lg" onClick={clearLevelUp}>
              Enter {next.zone} →
            </Link>
          ) : (
            <Link to="/map" className="btn btn-primary btn-lg" onClick={clearLevelUp}>
              View map
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={clearLevelUp}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
