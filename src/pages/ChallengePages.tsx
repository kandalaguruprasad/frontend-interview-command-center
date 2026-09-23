import { Link, Navigate, useParams } from 'react-router-dom';
import { findMachineCoding, findSystemDesign } from '../data';

export function MachinePage() {
  const { id } = useParams();
  const item = id ? findMachineCoding(id) : undefined;
  if (!item) return <Navigate to="/map" replace />;
  return (
    <ChallengeDoc
      back="/map"
      title={item.title}
      timeLimit={item.timeLimit}
      body={item.requirements}
      criteria={item.acceptanceCriteria}
      extra={item.rubric}
    />
  );
}

export function SystemPage() {
  const { id } = useParams();
  const item = id ? findSystemDesign(id) : undefined;
  if (!item) return <Navigate to="/map" replace />;
  const body = [
    Array.isArray(item.functionalRequirements)
      ? (item.functionalRequirements as string[]).join('\n')
      : '',
    Array.isArray(item.nonFunctionalRequirements)
      ? (item.nonFunctionalRequirements as string[]).join('\n')
      : '',
    (item.componentArchitecture as string) || '',
    (item.spokenAnswer as string) || '',
  ]
    .filter(Boolean)
    .join('\n\n');
  return (
    <ChallengeDoc
      back="/map"
      title={item.title}
      timeLimit="45–60 min"
      body={body || item.title}
      criteria={(item.clarifyingQuestions as string[]) || []}
      extra={(item.tradeoffs as string) || ''}
    />
  );
}

function ChallengeDoc({
  back,
  title,
  timeLimit,
  body,
  criteria,
  extra,
}: {
  back: string;
  title: string;
  timeLimit: string;
  body: string;
  criteria: string[];
  extra: string;
}) {
  return (
    <>
      <p className="small faint">
        <Link to={back}>← Back</Link>
      </p>
      <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
        {title}
      </h1>
      <p className="small muted mt-8">{timeLimit}</p>
      <div className="prose-block prose mt-16">{body}</div>
      {criteria?.length ? (
        <>
          <h4 className="mt-16">Acceptance</h4>
          <ul className="muted">
            {criteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}
      {extra ? <pre className="code-block mt-16">{extra}</pre> : null}
      <p className="muted mt-16">
        Do the work in your editor, then return to the boss page to claim with written reflection.
      </p>
    </>
  );
}
