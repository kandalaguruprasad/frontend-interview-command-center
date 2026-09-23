import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { findLevel, findTopic } from '../data';
import {
  completeTopicMission,
  isLevelUnlocked,
  markMissionOpened,
  markMissionPractise,
  markMissionRecall,
  missionStage,
} from '../quest/engine';
import { useStore } from '../state/store';
import type { ItemStatus } from '../types';

const STAGES = ['learn', 'recall', 'practise', 'complete'] as const;

export function MissionPage() {
  const { levelId: levelIdStr, topicId } = useParams();
  const levelId = Number(levelIdStr);
  const level = findLevel(levelId);
  const topic = topicId ? findTopic(topicId) : undefined;
  const { state, setState, pushXpPopup } = useStore();
  const navigate = useNavigate();
  const [showAnswer, setShowAnswer] = useState(false);
  const [notes, setNotes] = useState('');

  if (!level || !topic) return <Navigate to="/map" replace />;
  if (!isLevelUnlocked(state, level.id)) return <Navigate to="/map" replace />;
  if (!level.requiredTopics.includes(topic.id)) return <Navigate to={`/level/${level.id}`} replace />;

  const stage = missionStage(state, topic.id);
  const stageIndex = stage === 'done' ? 4 : STAGES.indexOf(stage as (typeof STAGES)[number]);

  return (
    <>
      <p className="small faint">
        <Link to={`/level/${level.id}`}>← {level.zone}</Link>
      </p>
      <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
        {topic.title}
      </h1>
      <p className="small muted mt-8">
        Level {level.id} mission · {topic.level}
      </p>

      <div className="stage-pills">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`stage-pill ${i < stageIndex ? 'done' : ''} ${stage === s ? 'active' : ''}`}
          >
            {s}
          </span>
        ))}
        {stage === 'done' ? <span className="stage-pill done">done</span> : null}
      </div>

      {stage === 'learn' ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Learn</h3>
          <p className="prose">{topic.explanation}</p>
          <h4 className="mt-16">Why it matters</h4>
          <div className="prose-block prose">{topic.whyItMatters}</div>
          <h4 className="mt-16">Simple example</h4>
          <pre className="code-block">{topic.simpleExample}</pre>
          <h4 className="mt-16">Common mistake</h4>
          <div className="prose-block prose">{topic.commonMistake}</div>
          <h4 className="mt-16">Interview answer</h4>
          <div className="prose-block prose">{topic.interviewAnswer}</div>
          <button
            type="button"
            className="btn btn-primary mt-16"
            onClick={() => markMissionOpened(setState, topic.id)}
          >
            I studied this — go to Recall →
          </button>
        </section>
      ) : null}

      {stage === 'recall' ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Recall</h3>
          <p className="muted">
            Explain this aloud (or write from memory) without peeking. Then score yourself.
          </p>
          <ul className="mt-12 muted small">
            {topic.followUps?.slice(0, 3).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {!showAnswer ? (
            <button type="button" className="btn btn-ghost mt-12" onClick={() => setShowAnswer(true)}>
              Reveal model answer
            </button>
          ) : (
            <div className="prose-block prose mt-12">{topic.interviewAnswer}</div>
          )}
          <div className="flex gap-12 flex-wrap mt-16">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => markMissionRecall(setState, pushXpPopup, topic.id, true)}
            >
              I recalled it (+10 XP)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => markMissionRecall(setState, pushXpPopup, topic.id, false)}
            >
              Needs more work
            </button>
          </div>
        </section>
      ) : null}

      {stage === 'practise' ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Practise</h3>
          <p className="muted">Mini exercise</p>
          <div className="prose-block prose">{topic.miniExercise}</div>
          <div className="field">
            <label htmlFor="notes">Your notes / attempt</label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot what you tried..."
            />
          </div>
          <button
            type="button"
            className="btn btn-primary mt-12"
            onClick={() => markMissionPractise(setState, pushXpPopup, topic.id)}
          >
            Mark practised (+15 XP)
          </button>
        </section>
      ) : null}

      {stage === 'complete' ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Complete mission</h3>
          <p className="muted">How solid is this topic for an interview?</p>
          <div className="flex gap-12 flex-wrap mt-16">
            {(
              [
                ['needs_revision', 'Needs revision'],
                ['confident', 'Confident'],
                ['mastered', 'Mastered'],
              ] as [ItemStatus, string][]
            ).map(([status, label]) => (
              <button
                key={status}
                type="button"
                className={`btn ${status === 'needs_revision' ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => {
                  const done = completeTopicMission(setState, pushXpPopup, topic.id, status);
                  if (done) navigate(`/level/${level.id}`);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="small faint mt-12">
            Confident or Mastered finishes the mission and awards XP.
          </p>
        </section>
      ) : null}

      {stage === 'done' ? (
        <>
          <div className="good-banner">Mission complete.</div>
          <Link to={`/level/${level.id}`} className="btn btn-primary mt-16">
            Back to {level.zone}
          </Link>
        </>
      ) : null}
    </>
  );
}
