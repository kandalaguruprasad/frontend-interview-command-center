import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QUESTIONS } from '../data';
import { awardXP, computeReadinessScore, recordBossAttempt } from '../quest/engine';
import { findLevel } from '../data';
import { useStore } from '../state/store';
import type { Question } from '../types';

export function MockPage() {
  const { state, setState, pushXpPopup, triggerLevelUp } = useStore();
  const level = findLevel(10)!;
  const readiness = computeReadinessScore(state).total;
  const [duration, setDuration] = useState(15);
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [qs, setQs] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState<{ avg: number; pass: boolean } | null>(null);

  const canFinal = readiness >= (level.requirements?.minReadiness || 40);

  const pool = useMemo(() => [...QUESTIONS].sort(() => Math.random() - 0.5), []);

  const start = (mins: number) => {
    const count = mins <= 15 ? 6 : mins <= 30 ? 10 : mins <= 45 ? 14 : 18;
    setQs(pool.slice(0, count));
    setDuration(mins);
    setSecondsLeft(mins * 60);
    setIdx(0);
    setScores([]);
    setDone(null);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || done) return;
    if (secondsLeft <= 0) {
      endSession(scores);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, secondsLeft, done]);

  const endSession = (finalScores: number[]) => {
    const avg =
      finalScores.length > 0
        ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length
        : 0;
    const avg5 = avg / 20; // 0-100 -> 0-5
    setState((s) => ({
      ...s,
      mockSessions: [
        ...s.mockSessions,
        { date: new Date().toISOString(), duration, score: avg, category: 'mixed' },
      ],
    }));
    awardXP(setState, pushXpPopup, 120, `Mock ${duration}m`, `mock:${duration}:${Date.now()}`);

    const isFinal = duration === 60;
    const pass = isFinal && avg5 >= 4;
    if (pass && !state.quest.bossPassed[10]) {
      recordBossAttempt(setState, 10, Math.round(avg), true);
      awardXP(setState, pushXpPopup, 150, 'Boss battle passed: Interview Arena', 'boss:10:pass');
      triggerLevelUp(10);
    }
    setDone({ avg: Math.round(avg), pass });
    setStarted(false);
  };

  const q = qs[idx];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Mock complete</h1>
        <p className="mt-12" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          {done.avg}%
        </p>
        {done.pass ? (
          <div className="good-banner">Final boss cleared!</div>
        ) : duration === 60 ? (
          <div className="warn-banner">Need average ≥ 4/5 (80%) on a 60-minute round.</div>
        ) : (
          <p className="muted mt-8">Try longer rounds when ready for the final boss.</p>
        )}
        <Link to="/level/10" className="btn btn-primary mt-16">
          Back to arena
        </Link>
      </div>
    );
  }

  if (started && q) {
    return (
      <div className="card">
        <div className="flex justify-between">
          <span className="quiz-timer">
            {mm}:{ss}
          </span>
          <span className="small faint">
            Q {idx + 1}/{qs.length}
          </span>
        </div>
        <h2 className="mt-16" style={{ fontSize: '1.15rem' }}>
          {q.question}
        </h2>
        <details className="mt-16">
          <summary className="small muted" style={{ cursor: 'pointer' }}>
            Peek strong answer
          </summary>
          <div className="prose-block prose mt-8">{q.strong}</div>
        </details>
        <p className="small muted mt-16">Self-score (0–100)</p>
        <div className="chip-row mt-8">
          {[0, 25, 50, 75, 100].map((v) => (
            <button
              key={v}
              type="button"
              className="chip"
              onClick={() => {
                const next = [...scores, v];
                setScores(next);
                if (idx + 1 >= qs.length) endSession(next);
                else setIdx(idx + 1);
              }}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="small faint">
        <Link to="/level/10">← Final Interview</Link>
      </p>
      <h1 className="page-title">Mock Interview</h1>
      <p className="page-sub">
        Readiness {readiness}% {canFinal ? '· Final unlocked' : `· need ${level.requirements?.minReadiness}% for Level 10 boss`}
      </p>
      <div className="flex gap-12 flex-wrap mt-16">
        {[15, 30, 45, 60].map((m) => (
          <button
            key={m}
            type="button"
            className="btn btn-primary"
            disabled={m === 60 && !canFinal}
            onClick={() => start(m)}
          >
            {m} min
          </button>
        ))}
      </div>
      {state.mockSessions.length ? (
        <p className="small faint mt-16">{state.mockSessions.length} mock sessions recorded</p>
      ) : null}
    </>
  );
}
