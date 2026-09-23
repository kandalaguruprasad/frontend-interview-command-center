import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { findLab } from '../data';
import { awardXP } from '../quest/engine';
import { getItem, setItemStatus, useStore } from '../state/store';

export function LabPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const levelId = params.get('level');
  const lab = id ? findLab(id) : undefined;
  const { state, setState, pushXpPopup } = useStore();

  if (!lab) return <Navigate to="/map" replace />;
  const status = getItem(state, 'lab', lab.id).status;
  const back = levelId ? `/level/${levelId}` : '/map';
  const prompt = [
    lab.scenario as string,
    lab.requirements as string,
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <>
      <p className="small faint">
        <Link to={back}>← Back</Link>
      </p>
      <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
        {lab.title}
      </h1>
      <p className="small muted mt-8">Status: {status.replace(/_/g, ' ')}</p>
      <div className="prose-block prose mt-16">{prompt}</div>
      <p className="muted mt-12">
        Build this in your own editor. When you can explain and defend it, mark confident.
      </p>
      <div className="flex gap-12 flex-wrap mt-16">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setState((s) => setItemStatus(s, 'lab', lab.id, 'confident'));
            awardXP(setState, pushXpPopup, 100, `Lab complete: ${lab.title}`, `lab:${lab.id}:confident`);
          }}
        >
          Mark confident (+100 XP)
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setState((s) => setItemStatus(s, 'lab', lab.id, 'mastered'))}
        >
          Mark mastered
        </button>
      </div>
    </>
  );
}
