import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { findCoding } from '../data';
import { runCodingTests, type TestResult } from '../features/codingRunner';
import { awardXP } from '../quest/engine';
import { getItem, setCodingProgress, useStore } from '../state/store';

export function CodingPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const levelId = params.get('level');
  const problem = id ? findCoding(id) : undefined;
  const { state, setState, pushXpPopup } = useStore();
  const [code, setCode] = useState(problem?.starter || '');
  const [hintsOpen, setHintsOpen] = useState(false);
  const [usedHints, setUsedHints] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const progress = problem
    ? getItem(state, 'coding', problem.id).codingProgress || 'not_viewed'
    : 'not_viewed';

  const back = useMemo(
    () => (levelId ? `/level/${levelId}` : '/map'),
    [levelId],
  );

  if (!problem) return <Navigate to="/map" replace />;

  const run = async () => {
    setRunning(true);
    try {
      const { results: r, progress: p } = await runCodingTests(problem, code, usedHints);
      setResults(r);
      setState((s) => setCodingProgress(s, problem.id, p));
      if (p === 'solved_no_help') {
        awardXP(setState, pushXpPopup, 60, `Solved: ${problem.title}`, `coding:${problem.id}:solved_no_help`);
      } else if (p === 'solved_with_hints') {
        awardXP(setState, pushXpPopup, 40, `Solved: ${problem.title}`, `coding:${problem.id}:solved_with_hints`);
      } else if (p === 'tests_partial') {
        awardXP(setState, pushXpPopup, 20, `Partial: ${problem.title}`, `coding:${problem.id}:tests_partial`);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <p className="small faint">
        <Link to={back}>← Back</Link>
      </p>
      <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
        {problem.title}
      </h1>
      <p className="small muted mt-8">
        {problem.difficulty} · {progress.replace(/_/g, ' ')}
      </p>
      <div className="prose-block prose mt-16">{problem.statement}</div>
      <h4 className="mt-16">Examples</h4>
      <pre className="code-block">{problem.examples}</pre>
      <h4 className="mt-16">Your solution</h4>
      <textarea
        className="code-block"
        style={{ width: '100%', minHeight: 200, resize: 'vertical' }}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
      />
      <div className="flex gap-12 flex-wrap mt-12">
        <button type="button" className="btn btn-primary" disabled={running} onClick={run}>
          {running ? 'Running…' : 'Run tests'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setHintsOpen(true);
            setUsedHints(true);
          }}
        >
          Show hints
        </button>
      </div>
      {hintsOpen ? (
        <ul className="mt-12 muted">
          {problem.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}
      {results ? (
        <ul className="mission-list mt-16">
          {results.map((r) => (
            <li key={r.desc} className={r.pass ? 'done' : ''}>
              <span>{r.desc}</span>
              <span className="badge">{r.pass ? 'Pass' : r.error || 'Fail'}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
