import { useStore } from '../state/store';

export function XpPopups() {
  const { xpPopups } = useStore();
  if (!xpPopups.length) return null;
  return (
    <div className="xp-popup-stack" aria-live="polite">
      {xpPopups.map((p) => (
        <div key={p.id} className="xp-popup">
          +{p.amount} XP — {p.reason}
        </div>
      ))}
    </div>
  );
}
