import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { findCoding, findLevel, questionsForCategory } from '../data';
import {
  awardXP,
  bossAttemptedToday,
  codingBossProgress,
  isLevelUnlocked,
  levelRequirementsMet,
  recordBossAttempt,
} from '../quest/engine';
import { useStore } from '../state/store';
import type { Question } from '../types';

const HEARTS = 3;
const PASS_PCT = 70;

function pickQuestions(category: string, count = 8): Question[] {
  const pool = questionsForCategory(category);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function BossPage() {
  const { levelId: levelIdStr } = useParams();
  const levelId = Number(levelIdStr);
  const level = findLevel(levelId);
  const { state } = useStore();
  const navigate = useNavigate();

  if (!level) return <Navigate to="/map" replace />;
  if (!isLevelUnlocked(state, level.id)) return <Navigate to="/map" replace />;

  const passed = !!state.quest.bossPassed[level.id];
  const ready = levelRequirementsMet(state, level);
  const attemptedToday = bossAttemptedToday(state, level.id);

  if (level.boss.type === 'quiz') {
    return (
      <QuizBoss
        levelId={level.id}
        passed={passed}
        ready={ready}
        attemptedToday={attemptedToday}
      />
    );
  }

  if (level.boss.type === 'coding') {
    return <CodingBossGate levelId={level.id} />;
  }

  if (level.boss.type === 'machinecoding' || level.boss.type === 'systemdesign') {
    return <ClaimBoss levelId={level.id} />;
  }

  if (level.boss.type === 'project') {
    return <ProjectBossGate />;
  }

  if (level.boss.type === 'mockinterview') {
    return <MockBossGate />;
  }

  return (
    <div className="card">
      <p>Unknown boss type.</p>
      <button type="button" className="btn btn-ghost" onClick={() => navigate(`/level/${levelId}`)}>
        Back
      </button>
    </div>
  );
}

function QuizBoss({
  levelId,
  passed,
  ready,
  attemptedToday,
}: {
  levelId: number;
  passed: boolean;
  ready: boolean;
  attemptedToday: boolean;
}) {
  const level = findLevel(levelId)!;
  const { setState, pushXpPopup, triggerLevelUp } = useStore();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState((level.boss.duration || 15) * 60);
  const [finished, setFinished] = useState<{ pct: number; passed: boolean } | null>(null);

  const start = () => {
    const qs = pickQuestions(level.boss.category || 'html');
    setQuestions(qs);
    setIdx(0);
    setHearts(HEARTS);
    setRevealed(false);
    setScores([]);
    setSecondsLeft((level.boss.duration || 15) * 60);
    setFinished(null);
    setStarted(true);
  };

  const finish = useCallback(
    (finalScores: number[], heartsLeft: number) => {
      if (finished) return;
      const avg =
        finalScores.length > 0
          ? Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length)
          : 0;
      const ok = avg >= PASS_PCT && heartsLeft > 0;
      recordBossAttempt(setState, level.id, avg, ok);
      if (ok) {
        awardXP(setState, pushXpPopup, 150, `Boss battle passed: ${level.title}`, `boss:${level.id}:pass`);
        triggerLevelUp(level.id);
      }
      setFinished({ pct: avg, passed: ok });
      setStarted(false);
    },
    [finished, level, setState, pushXpPopup, triggerLevelUp],
  );

  useEffect(() => {
    if (!started || finished) return;
    if (secondsLeft <= 0) {
      finish(scores, hearts);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, secondsLeft, finished, scores, hearts, finish]);

  const q = questions[idx];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (passed) {
    return (
      <div className="card">
        <div className="good-banner">Boss already defeated.</div>
        <Link to={`/level/${level.id}`} className="btn btn-primary mt-16">
          Back to zone
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="card">
        <p className="muted">Finish all missions before the boss.</p>
        <Link to={`/level/${level.id}`} className="btn btn-ghost mt-12">
          Back
        </Link>
      </div>
    );
  }

  if (attemptedToday && !finished) {
    return (
      <div className="card">
        <div className="warn-banner">Already attempted today. Retry tomorrow.</div>
        <Link to={`/level/${level.id}`} className="btn btn-ghost mt-12">
          Back
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <h1 className="page-title">{finished.passed ? 'Victory!' : 'Defeated'}</h1>
        <p className="mt-12" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          {finished.pct}%
        </p>
        <p className="muted mt-8">Need {PASS_PCT}% to pass · hearts left counted</p>
        {finished.passed ? (
          <p className="good-banner">+150 XP · Zone unlocked ahead</p>
        ) : (
          <p className="warn-banner">Come back tomorrow for another attempt.</p>
        )}
        <Link to={`/level/${level.id}`} className="btn btn-primary btn-lg mt-16">
          Continue
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="card">
        <p className="small faint">
          <Link to={`/level/${level.id}`}>← {level.zone}</Link>
        </p>
        <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
          Boss: {level.title}
        </h1>
        <p className="muted mt-12">{level.boss.description}</p>
        <ul className="mt-16 muted">
          <li>{level.boss.duration} minutes, no pausing</li>
          <li>3 hearts — revealing before scoring costs one if you then skip</li>
          <li>Need {PASS_PCT}% average self-score to pass</li>
        </ul>
        <button type="button" className="btn btn-primary btn-lg mt-16" onClick={start}>
          Begin battle
        </button>
      </div>
    );
  }

  if (!q) {
    finish(scores, hearts);
    return null;
  }

  const scoreAndNext = (score: number) => {
    const nextScores = [...scores, score];
    setScores(nextScores);
    setRevealed(false);
    if (idx + 1 >= questions.length) finish(nextScores, hearts);
    else setIdx(idx + 1);
  };

  const revealCost = () => {
    if (revealed) return;
    setRevealed(true);
    setHearts((h) => {
      const next = h - 1;
      if (next <= 0) {
        setTimeout(() => finish(scores, 0), 0);
      }
      return next;
    });
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center flex-wrap gap-8">
        <span className="quiz-timer">
          {mm}:{ss}
        </span>
        <div className="hearts" aria-label={`${hearts} hearts`}>
          {Array.from({ length: HEARTS }, (_, i) => (
            <span key={i} className={`heart ${i >= hearts ? 'lost' : ''}`}>
              ♥
            </span>
          ))}
        </div>
        <span className="small faint">
          Q {idx + 1}/{questions.length}
        </span>
      </div>
      <h2 className="mt-16" style={{ fontSize: '1.2rem' }}>
        {q.question}
      </h2>
      {!revealed ? (
        <button type="button" className="btn btn-ghost mt-16" onClick={revealCost}>
          Reveal strong answer (−1 heart)
        </button>
      ) : (
        <div className="prose-block prose mt-16">{q.strong}</div>
      )}
      <p className="small muted mt-16">Score your answer (honest self-score)</p>
      <div className="chip-row mt-8">
        {[0, 25, 50, 75, 100].map((v) => (
          <button key={v} type="button" className="chip" onClick={() => scoreAndNext(v)}>
            {v}%
          </button>
        ))}
      </div>
    </div>
  );
}

function CodingBossGate({ levelId }: { levelId: number }) {
  const level = findLevel(levelId)!;
  const { state, setState, pushXpPopup, triggerLevelUp } = useStore();
  const prog = codingBossProgress(state, level);
  const passed = !!state.quest.bossPassed[level.id];

  return (
    <div className="card">
      <p className="small faint">
        <Link to={`/level/${level.id}`}>← {level.zone}</Link>
      </p>
      <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
        Coding Boss
      </h1>
      <p className="muted mt-12">{level.boss.description}</p>
      <ul className="mission-list">
        {(level.boss.codingIds || []).map((id) => {
          const c = findCoding(id);
          return (
            <li key={id}>
              <Link to={`/coding/${id}?level=${level.id}`}>{c?.title || id}</Link>
            </li>
          );
        })}
      </ul>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${prog.pct}%` }} />
      </div>
      <p className="small muted mt-8">
        {prog.solved}/{prog.total} solved (need 70%)
      </p>
      {passed ? (
        <div className="good-banner">Boss defeated.</div>
      ) : prog.pct >= 70 ? (
        <button
          type="button"
          className="btn btn-primary mt-12"
          onClick={() => {
            recordBossAttempt(setState, level.id, prog.pct, true);
            awardXP(setState, pushXpPopup, 150, `Boss battle passed: ${level.title}`, `boss:${level.id}:pass`);
            triggerLevelUp(level.id);
          }}
        >
          Claim boss victory
        </button>
      ) : (
        <p className="small faint mt-12">Solve at least 70% of the listed problems.</p>
      )}
    </div>
  );
}

const CLAIM_CRITERIA = [
  { key: 'technical', label: 'Technical correctness', weight: 40 },
  { key: 'clarity', label: 'Explanation clarity', weight: 25 },
  { key: 'edgecases', label: 'Edge cases considered', weight: 15 },
  { key: 'tradeoffs', label: 'Trade-offs discussed', weight: 10 },
  { key: 'confidence', label: 'Confidence & structure', weight: 10 },
] as const;

const REFLECTION_FIELDS = [
  { key: 'approach', label: 'Your approach / component breakdown' },
  { key: 'edgecases', label: 'Edge cases you handled' },
  { key: 'tradeoffs', label: 'Trade-offs you considered' },
  { key: 'reflection', label: 'What would you do differently next time?' },
] as const;

function ClaimBoss({ levelId }: { levelId: number }) {
  const level = findLevel(levelId)!;
  const { state, setState, pushXpPopup, triggerLevelUp } = useStore();
  const passed = !!state.quest.bossPassed[level.id];
  const attemptedToday = bossAttemptedToday(state, level.id);
  const [reflection, setReflection] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ pct: number; ok: boolean } | null>(null);

  const reflectionsOk = REFLECTION_FIELDS.every(
    (f) => (reflection[f.key] || '').trim().length >= 20,
  );
  const ratingsOk = CLAIM_CRITERIA.every((c) => ratings[c.key] !== undefined);
  const score = useMemo(() => {
    return CLAIM_CRITERIA.reduce((sum, c) => sum + ((ratings[c.key] || 0) * c.weight) / 100, 0);
  }, [ratings]);

  const refPath =
    level.boss.type === 'machinecoding'
      ? `/machine/${level.boss.refId}`
      : `/system/${level.boss.refId}`;

  if (passed) {
    return (
      <div className="card">
        <div className="good-banner">Boss defeated.</div>
        <Link to={`/level/${level.id}`} className="btn btn-primary mt-16">
          Back
        </Link>
      </div>
    );
  }

  if (attemptedToday && !result) {
    return (
      <div className="card">
        <div className="warn-banner">Already attempted today. Retry tomorrow.</div>
        <Link to={`/level/${level.id}`} className="btn btn-ghost mt-12">
          Back
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="page-title">{result.ok ? 'Victory!' : 'Not yet'}</h1>
        <p className="mt-12" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          {Math.round(result.pct)}%
        </p>
        <Link to={`/level/${level.id}`} className="btn btn-primary mt-16">
          Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="small faint">
        <Link to={`/level/${level.id}`}>← {level.zone}</Link>
      </p>
      <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
        Claim: {level.title}
      </h1>
      <p className="muted mt-12">{level.boss.description}</p>
      <Link to={refPath} className="btn btn-ghost mt-12">
        Open reference challenge
      </Link>

      {REFLECTION_FIELDS.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={f.key}>{f.label}</label>
          <textarea
            id={f.key}
            rows={2}
            value={reflection[f.key] || ''}
            onChange={(e) => setReflection((r) => ({ ...r, [f.key]: e.target.value }))}
            placeholder="At least 20 characters..."
          />
        </div>
      ))}

      {!reflectionsOk ? (
        <p className="small faint mt-12">Fill every reflection to unlock scoring.</p>
      ) : (
        <>
          {CLAIM_CRITERIA.map((c) => (
            <div className="field" key={c.key}>
              <label>
                {c.label} ({c.weight}%)
              </label>
              <div className="chip-row">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${ratings[c.key] === v ? 'selected' : ''}`}
                    onClick={() => setRatings((r) => ({ ...r, [c.key]: v }))}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="small muted mt-12">Score: {Math.round(score)}% (need 70%)</p>
          <button
            type="button"
            className="btn btn-primary mt-12"
            disabled={!ratingsOk}
            onClick={() => {
              const ok = score >= 70;
              recordBossAttempt(setState, level.id, Math.round(score), ok);
              if (ok) {
                awardXP(
                  setState,
                  pushXpPopup,
                  150,
                  `Boss battle passed: ${level.title}`,
                  `boss:${level.id}:pass`,
                );
                triggerLevelUp(level.id);
              }
              setResult({ pct: score, ok });
            }}
          >
            Submit claim
          </button>
        </>
      )}
    </div>
  );
}

function ProjectBossGate() {
  return (
    <div className="card">
      <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
        Project Boss
      </h1>
      <p className="muted mt-12">
        Mark every project defence question as confident, then claim victory on the level page.
      </p>
      <Link to="/projects" className="btn btn-primary mt-16">
        Open projects
      </Link>
    </div>
  );
}

function MockBossGate() {
  return (
    <div className="card">
      <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
        Final Interview
      </h1>
      <p className="muted mt-12">Run timed mock rounds. Clear a 60-minute round at 4/5 average to pass.</p>
      <Link to="/mock" className="btn btn-primary mt-16">
        Start mock interview
      </Link>
    </div>
  );
}
